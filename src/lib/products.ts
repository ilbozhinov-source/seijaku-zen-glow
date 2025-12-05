// Local product data
import productImage from '@/assets/seijaku-matcha-product.jpg';

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

// Static product data
export const products: Product[] = [
  {
    id: 'product-1',
    title: 'products.productTitle',
    description: 'products.productDescription',
    handle: 'seijaku-ceremonial-matcha',
    priceRange: {
      minVariantPrice: {
        amount: '28.00',
        currencyCode: 'BGN',
      },
    },
    images: [
      {
        url: productImage,
        altText: 'SEIJAKU Церемониална Матча',
      },
    ],
    variants: [
      {
        id: 'variant-30g',
        title: '30g',
        price: {
          amount: '28.00',
          currencyCode: 'BGN',
        },
        availableForSale: true,
        selectedOptions: [
          { name: 'Размер', value: '30g' },
        ],
      },
      {
        id: 'variant-50g',
        title: '50g',
        price: {
          amount: '79.00',
          currencyCode: 'BGN',
        },
        availableForSale: false,
        selectedOptions: [
          { name: 'Размер', value: '50g' },
        ],
      },
      {
        id: 'variant-100g',
        title: '100g',
        price: {
          amount: '149.00',
          currencyCode: 'BGN',
        },
        availableForSale: false,
        selectedOptions: [
          { name: 'Размер', value: '100g' },
        ],
      },
    ],
    options: [
      {
        name: 'Размер',
        values: ['30g', '50g', '100g'],
      },
    ],
  },
];

// Functions to get products (can be expanded to use Supabase later)
export function getProducts(): Product[] {
  return products;
}

export function getProductByHandle(handle: string): Product | null {
  return products.find(p => p.handle === handle) || null;
}

export function getProductById(id: string): Product | null {
  return products.find(p => p.id === id) || null;
}