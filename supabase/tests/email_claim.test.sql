\pset format unaligned
\pset tuples_only on
set role service_role;
select 'claim #1 (pending -> sending): ' || claim_order_email((select id from orders where order_number='NOVA-10001'));
select 'claim #2 while sending (must be false): ' || claim_order_email((select id from orders where order_number='NOVA-10001'));
update orders set email_status='failed', email_error='boom' where order_number='NOVA-10001';
select 'claim after failure (must be true): ' || claim_order_email((select id from orders where order_number='NOVA-10001'));
update orders set email_status='sent' where order_number='NOVA-10001';
select 'claim after sent (must be false): ' || claim_order_email((select id from orders where order_number='NOVA-10001'));
reset role;
set role authenticated;
select claim_order_email(gen_random_uuid());
