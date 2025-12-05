-- Add phone-related columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS phone_country_code text,
ADD COLUMN IF NOT EXISTS phone_number text;

-- Update existing customer_phone to be the full phone (phone_full will be customer_phone)