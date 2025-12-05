-- Add shipping country and shipping price columns to orders table
ALTER TABLE public.orders 
ADD COLUMN shipping_country text,
ADD COLUMN shipping_price numeric DEFAULT 0,
ADD COLUMN total_with_shipping numeric;