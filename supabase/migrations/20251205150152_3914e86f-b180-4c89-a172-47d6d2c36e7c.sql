-- Add courier office columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS courier_office_id TEXT,
ADD COLUMN IF NOT EXISTS courier_office_name TEXT,
ADD COLUMN IF NOT EXISTS courier_office_address TEXT;