\pset format unaligned
\pset tuples_only on
\echo '--- RLS: user A (owns NOVA-10001) '
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select 'A sees orders: ' || coalesce(string_agg(order_number, ','),'none') from orders;
select 'A sees items: ' || count(*) from order_items;
\echo '--- RLS: user B (owns nothing)'
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select 'B sees orders: ' || count(*) from orders;
select 'B sees items: ' || count(*) from order_items;
\echo '--- B tries to write (all must be denied)'
insert into orders (idempotency_key,customer_name,customer_email,phone,address,city,subtotal,total) values (gen_random_uuid(),'Evil','e@x.com','1234567','addr12','city',0,0);
update orders set status='cancelled' where order_number='NOVA-10001';
delete from orders;
update products set price=0;
select * from newsletter_subscribers;
select create_order(gen_random_uuid(),null,'X Y','x@example.com','08012345678','4 Elm Street','Lagos','[{"product_id":"143e74f4-f95c-44c5-845a-7bc1176b7906","quantity":1}]'::jsonb);
\echo '--- anon'
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
select 'anon reads products: ' || count(*) from products;
select count(*) from orders;
select create_order(gen_random_uuid(),null,'X Y','x@example.com','08012345678','4 Elm Street','Lagos','[]'::jsonb);
reset role;
\echo '--- integrity: nothing changed'
select 'orders=' || count(*) || ' statuses=' || string_agg(distinct status,',') || ' lamp_price=' || (select price from products where slug='halo-table-lamp') from orders;
