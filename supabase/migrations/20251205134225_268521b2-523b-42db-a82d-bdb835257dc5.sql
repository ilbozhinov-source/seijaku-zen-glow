-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  handle TEXT NOT NULL UNIQUE,
  image_url TEXT,
  image_alt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_variants table
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BGN',
  available_for_sale BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Everyone can view products
CREATE POLICY "Anyone can view products"
ON public.products FOR SELECT
USING (true);

-- Only admins can manage products
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Everyone can view variants
CREATE POLICY "Anyone can view product variants"
ON public.product_variants FOR SELECT
USING (true);

-- Only admins can manage variants
CREATE POLICY "Admins can insert variants"
ON public.product_variants FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update variants"
ON public.product_variants FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete variants"
ON public.product_variants FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial product data
INSERT INTO public.products (id, title, description, handle, image_url, image_alt)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'SEIJAKU Церемониална Матча',
  'Премиум церемониална матча от Япония',
  'seijaku-ceremonial-matcha',
  '/seijaku-matcha-product.jpg',
  'SEIJAKU Церемониална Матча'
);

-- Insert variants
INSERT INTO public.product_variants (product_id, title, price, currency, available_for_sale, sort_order)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '30g', 28.00, 'BGN', true, 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '50g', 79.00, 'BGN', false, 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '100g', 149.00, 'BGN', false, 3);