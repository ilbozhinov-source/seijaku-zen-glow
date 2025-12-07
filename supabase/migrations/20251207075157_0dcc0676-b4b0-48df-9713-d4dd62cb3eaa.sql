-- Add fulfillment tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS sent_to_fulfillment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fulfillment_error text,
ADD COLUMN IF NOT EXISTS fulfillment_order_id text,
ADD COLUMN IF NOT EXISTS postal_code text;