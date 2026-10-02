-- NOVA schema: products, orders, order_items, newsletter_subscribers.
-- Run in the Supabase SQL editor (or `supabase db push`). Safe to read top to bottom.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 160),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  price       numeric(10, 2) not null check (price >= 0),
  image_url   text,
  images      jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  category    text not null check (char_length(category) between 1 and 60),
  stock       integer not null default 0 check (stock >= 0),
  featured    boolean not null default false,
  badge       text check (badge is null or char_length(badge) <= 24),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index products_category_idx   on public.products (category);
create index products_created_at_idx on public.products (created_at desc);
create index products_featured_idx   on public.products (featured) where featured;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start with 10001;

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  -- Customer-facing number, e.g. NOVA-10001. The uuid is never shown as the primary identifier.
  order_number    text not null unique default ('NOVA-' || nextval('public.order_number_seq')::text),
  user_id         uuid references auth.users (id) on delete set null,
  -- Supplied by the browser once per checkout attempt; makes double-submits safe.
  idempotency_key uuid not null unique,
  -- Secret that lets a guest open their own success page. Never exposed in lists.
  access_token    text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  customer_name   text not null check (char_length(customer_name) between 2 and 100),
  customer_email  text not null check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(customer_email) <= 254),
  phone           text not null check (char_length(phone) between 7 and 25),
  address         text not null check (char_length(address) between 5 and 200),
  city            text not null check (char_length(city) between 2 and 100),
  subtotal        numeric(12, 2) not null check (subtotal >= 0),
  total           numeric(12, 2) not null check (total >= 0),
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  -- Email delivery is tracked separately so a mail failure never touches the order itself.
  email_status    text not null default 'pending' check (email_status in ('pending', 'sending', 'sent', 'failed')),
  email_error     text,
  email_sent_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  -- Snapshots: history must not change when the catalog does.
  product_name text not null,
  price        numeric(10, 2) not null check (price >= 0),
  quantity     integer not null check (quantity between 1 and 100),
  created_at   timestamptz not null default now(),
  unique (order_id, product_id)
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Newsletter
-- ---------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  created_at timestamptz not null default now()
);
create unique index newsletter_subscribers_email_idx on public.newsletter_subscribers (lower(email));

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Browser and user sessions can only READ: the catalog, and their own orders.
-- Every write goes through the service role on the server.
-- ---------------------------------------------------------------------------
alter table public.products               enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.newsletter_subscribers enable row level security;

revoke all on public.products, public.orders, public.order_items, public.newsletter_subscribers from anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.orders, public.order_items to authenticated;

create policy "Products are publicly readable"
  on public.products for select to anon, authenticated
  using (true);

create policy "Users can read their own orders"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can read items of their own orders"
  on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));

-- newsletter_subscribers has RLS enabled and no policies: only the service role can touch it.

-- ---------------------------------------------------------------------------
-- create_order: the single, transactional way an order comes into existence.
-- Prices and stock are read here from the database; the client's numbers are never trusted.
-- Replaying the same idempotency key returns the original order instead of creating another.
-- ---------------------------------------------------------------------------
create or replace function public.create_order(
  p_idempotency_key uuid,
  p_user_id         uuid,
  p_customer_name   text,
  p_customer_email  text,
  p_phone           text,
  p_address         text,
  p_city            text,
  p_items           jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing orders%rowtype;
  v_order    orders%rowtype;
  v_item     jsonb;
  v_product  products%rowtype;
  v_qty      integer;
  v_subtotal numeric(12, 2) := 0;
begin
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'invalid_items' using errcode = 'P0001';
  end if;

  if (select count(distinct i ->> 'product_id') from jsonb_array_elements(p_items) i) <> jsonb_array_length(p_items) then
    raise exception 'duplicate_items' using errcode = 'P0001';
  end if;

  -- Lock the products in a stable order so concurrent orders cannot deadlock or oversell.
  perform 1
    from products
   where id in (select (i ->> 'product_id')::uuid from jsonb_array_elements(p_items) i)
   order by id
     for update;

  -- Replay of an earlier request (double click, retry after a dropped connection).
  select * into v_existing from orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('created', false, 'order', to_jsonb(v_existing));
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'invalid_quantity' using errcode = 'P0001', detail = v_item ->> 'product_id';
    end if;

    select * into v_product from products where id = (v_item ->> 'product_id')::uuid;
    if not found then
      raise exception 'product_not_found' using errcode = 'P0001', detail = v_item ->> 'product_id';
    end if;
    if v_product.stock < v_qty then
      raise exception 'insufficient_stock' using errcode = 'P0001', detail = v_product.id::text;
    end if;

    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  insert into orders (idempotency_key, user_id, customer_name, customer_email, phone, address, city, subtotal, total)
  values (p_idempotency_key, p_user_id, p_customer_name, p_customer_email, p_phone, p_address, p_city, v_subtotal, v_subtotal)
  on conflict (idempotency_key) do nothing
  returning * into v_order;

  if v_order.id is null then
    select * into v_existing from orders where idempotency_key = p_idempotency_key;
    return jsonb_build_object('created', false, 'order', to_jsonb(v_existing));
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;

    insert into order_items (order_id, product_id, product_name, price, quantity)
    select v_order.id, p.id, p.name, p.price, v_qty
      from products p
     where p.id = (v_item ->> 'product_id')::uuid;

    update products set stock = stock - v_qty where id = (v_item ->> 'product_id')::uuid;
  end loop;

  return jsonb_build_object(
    'created', true,
    'order', to_jsonb(v_order),
    'items', (select coalesce(jsonb_agg(to_jsonb(oi)), '[]'::jsonb) from order_items oi where oi.order_id = v_order.id)
  );
end;
$$;

revoke execute on function public.create_order(uuid, uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant  execute on function public.create_order(uuid, uuid, text, text, text, text, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- claim_order_email: lets exactly one request send the confirmation email.
-- A retry or double submit that arrives while another request is sending gets false and skips.
-- A claim older than two minutes is treated as abandoned (the sender crashed) and can be retaken.
-- ---------------------------------------------------------------------------
create or replace function public.claim_order_email(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed uuid;
begin
  update orders
     set email_status = 'sending', email_error = null
   where id = p_order_id
     and (email_status in ('pending', 'failed')
          or (email_status = 'sending' and updated_at < now() - interval '2 minutes'))
  returning id into v_claimed;
  return v_claimed is not null;
end;
$$;

revoke execute on function public.claim_order_email(uuid) from public, anon, authenticated;
grant  execute on function public.claim_order_email(uuid) to service_role;
