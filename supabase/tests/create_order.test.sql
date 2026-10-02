\set ON_ERROR_STOP off
\pset format unaligned
\pset tuples_only on
begin;
-- fixtures
insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111','a@example.com'), ('22222222-2222-2222-2222-222222222222','b@example.com');
set local role service_role;
\echo '--- 1. happy path (lamp x2 @148 + notebook x1 @28 = 324)'
select (r->>'created') || ' | ' || (r->'order'->>'order_number') || ' | subtotal=' || (r->'order'->>'subtotal') || ' total=' || (r->'order'->>'total') || ' | items=' || jsonb_array_length(r->'items')
from (select create_order('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Ada Okoro','ada@example.com','+234 801 234 5678','12 Marina Road','Port Harcourt',
 '[{"product_id":"eee5650c-2bf6-4e48-8491-1663afae6cac","quantity":2},{"product_id":"143e74f4-f95c-44c5-845a-7bc1176b7906","quantity":1}]'::jsonb) r) s;
\echo '--- 2. stock after (lamp 14->12, notebook 60->59)'
select string_agg(name || '=' || stock, ', ' order by name) from products where slug in ('halo-table-lamp','field-notebook');
\echo '--- 3. replay same key -> created=false, no extra order, stock unchanged'
select (r->>'created') || ' | ' || (r->'order'->>'order_number') from (select create_order('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Ada Okoro','ada@example.com','+234 801 234 5678','12 Marina Road','Port Harcourt','[{"product_id":"eee5650c-2bf6-4e48-8491-1663afae6cac","quantity":2}]'::jsonb) r) s;
select 'orders=' || count(*) || ' lamp_stock=' || (select stock from products where slug='halo-table-lamp') from orders;
\echo '--- 4. guest order (user null)'
select (r->>'created') || ' | ' || (r->'order'->>'order_number') || ' user=' || coalesce(r->'order'->>'user_id','null') from (select create_order('aaaaaaaa-0000-0000-0000-000000000002',null,'Guest Buyer','guest@example.com','08012345678','4 Elm Street','Lagos','[{"product_id":"2b2e750f-623a-4a38-8e20-751f84c09d72","quantity":1}]'::jsonb) r) s;
commit;

\echo '--- 5. error cases (each must fail and leave no trace)'
select count(*) as orders_before from orders;
set role service_role;
select create_order('aaaaaaaa-0000-0000-0000-000000000003',null,'X Y','x@example.com','08012345678','4 Elm Street','Lagos','[{"product_id":"54593e56-86f1-4494-ad95-e1a327bb273e","quantity":1}]'::jsonb);
select create_order('aaaaaaaa-0000-0000-0000-000000000004',null,'X Y','x@example.com','08012345678','4 Elm Street','Lagos','[{"product_id":"67942c4a-b28a-4097-9fc0-afdc11d09f67","quantity":6}]'::jsonb);
select create_order('aaaaaaaa-0000-0000-0000-000000000005',null,'X Y','x@example.com','08012345678','4 Elm Street','Lagos','[{"product_id":"00000000-0000-0000-0000-000000000000","quantity":1}]'::jsonb);
select create_order('aaaaaaaa-0000-0000-0000-000000000006',null,'X Y','x@example.com','08012345678','4 Elm Street','Lagos','[{"product_id":"143e74f4-f95c-44c5-845a-7bc1176b7906","quantity":99}]'::jsonb);
select create_order('aaaaaaaa-0000-0000-0000-000000000007',null,'X Y','x@example.com','08012345678','4 Elm Street','Lagos','[{"product_id":"143e74f4-f95c-44c5-845a-7bc1176b7906","quantity":1},{"product_id":"143e74f4-f95c-44c5-845a-7bc1176b7906","quantity":1}]'::jsonb);
select create_order('aaaaaaaa-0000-0000-0000-000000000008',null,'X Y','x@example.com','08012345678','4 Elm Street','Lagos','[]'::jsonb);
select create_order('aaaaaaaa-0000-0000-0000-000000000009',null,'X','not-an-email','1','4','L','[{"product_id":"143e74f4-f95c-44c5-845a-7bc1176b7906","quantity":1}]'::jsonb);
select count(*) as orders_after from orders;
select 'notebook stock still ' || stock from products where slug='field-notebook';
reset role;
