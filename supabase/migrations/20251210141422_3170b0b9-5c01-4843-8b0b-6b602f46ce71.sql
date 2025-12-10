-- Add order_number column to orders table
ALTER TABLE public.orders ADD COLUMN order_number TEXT;

-- Create unique index on order_number
CREATE UNIQUE INDEX idx_orders_order_number ON public.orders(order_number);

-- Populate existing orders with first 8 characters of their UUID id
UPDATE public.orders SET order_number = LEFT(id::text, 8) WHERE order_number IS NULL;