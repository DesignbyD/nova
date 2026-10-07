-- NOVA shared cart
-- One server-side cart per authenticated user.

-- ---------------------------------------------------------------------------
-- Carts
-- ---------------------------------------------------------------------------

create table public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index carts_user_idx on public.carts (user_id);

create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Cart items
-- ---------------------------------------------------------------------------

create table public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity   integer not null check (quantity between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (cart_id, product_id)
);

create index cart_items_cart_idx on public.cart_items (cart_id);
create index cart_items_product_idx on public.cart_items (product_id);

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

revoke all on public.carts, public.cart_items from anon, authenticated;

grant select, insert, update, delete
  on public.carts, public.cart_items
  to authenticated;

-- Users can only access their own cart.

create policy "Users can read their own cart"
  on public.carts
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own cart"
  on public.carts
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own cart"
  on public.carts
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own cart"
  on public.carts
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can read their own cart items"
  on public.cart_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "Users can create their own cart items"
  on public.cart_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own cart items"
  on public.cart_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their own cart items"
  on public.cart_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = (select auth.uid())
    )
  );