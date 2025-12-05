-- Add missing columns for shipping logic
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_country_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_method TEXT,
ADD COLUMN IF NOT EXISTS courier_office_city TEXT,
ADD COLUMN IF NOT EXISTS courier_office_country_code TEXT;

-- Rename shipping_country to shipping_country_code for clarity (if needed)
-- Note: shipping_country already exists, we'll use it as the code