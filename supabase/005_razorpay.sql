-- Add Razorpay columns to orders table
alter table orders add column if not exists razorpay_order_id text unique;
alter table orders add column if not exists razorpay_payment_id text unique;

-- Allow payment_reference to be nullable (Razorpay uses razorpay_payment_id instead)
alter table orders alter column payment_reference drop not null;

notify pgrst, 'reload schema';
