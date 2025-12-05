// Product types and database functions
import { supabase } from '@/integrations/supabase/client';
import productImageStatic from '@/assets/seijaku-matcha-product.jpg';

export interface ProductVariant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  availableForSale: boolean;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: Array<{
    url: string;
    altText: string | null;
  }>;
  variants: ProductVariant[];
  options: Array<{
    name: string;
    values: string[];
  }>;
}

export interface CartItem {
  product: Product;
  variantId: string;
  variantTitle: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  quantity: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

// Database types
export interface DbProduct {
  id: string;
  title: string;
  description: string | null;
  handle: string;
  image_url: string | null;
  image_alt: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProductVariant {
  id: string;
  product_id: string;
  title: string;
  price: number;
  currency: string;
  available_for_sale: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Transform database product to app product format
function transformProduct(dbProduct: DbProduct, variants: DbProductVariant[]): Product {
  const sortedVariants = [...variants].sort((a, b) => a.sort_order - b.sort_order);
  const minPrice = Math.min(...sortedVariants.map(v => v.price));
  const currency = sortedVariants[0]?.currency || 'BGN';

  return {
    id: dbProduct.id,
    title: dbProduct.title,
    description: dbProduct.description || '',
    handle: dbProduct.handle,
    priceRange: {
      minVariantPrice: {
        amount: minPrice.toFixed(2),
        currencyCode: currency,
      },
    },
    images: [
      {
        url: productImageStatic, // Use static import for now
        altText: dbProduct.image_alt,
      },
    ],
    variants: sortedVariants.map(v => ({
      id: v.id,
      title: v.title,
      price: {
        amount: v.price.toFixed(2),
        currencyCode: v.currency,
      },
      availableForSale: v.available_for_sale,
      selectedOptions: [
        { name: 'Размер', value: v.title },
      ],
    })),
    options: [
      {
        name: 'Размер',
        values: sortedVariants.map(v => v.title),
      },
    ],
  };
}

// Fetch all products from database
export async function getProducts(): Promise<Product[]> {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*');

  if (productsError || !products) {
    console.error('Error fetching products:', productsError);
    return [];
  }

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('*')
    .order('sort_order');

  if (variantsError || !variants) {
    console.error('Error fetching variants:', variantsError);
    return [];
  }

  return products.map(product => {
    const productVariants = variants.filter(v => v.product_id === product.id);
    return transformProduct(product, productVariants);
  });
}

// Fetch single product by handle
export async function getProductByHandle(handle: string): Promise<Product | null> {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('handle', handle)
    .maybeSingle();

  if (productError || !product) {
    console.error('Error fetching product:', productError);
    return null;
  }

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order');

  if (variantsError || !variants) {
    console.error('Error fetching variants:', variantsError);
    return null;
  }

  return transformProduct(product, variants);
}

// Fetch single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (productError || !product) {
    console.error('Error fetching product:', productError);
    return null;
  }

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order');

  if (variantsError || !variants) {
    console.error('Error fetching variants:', variantsError);
    return null;
  }

  return transformProduct(product, variants);
}
