import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShopifyProduct } from '@/lib/shopify';

interface ProductSchemaProps {
  product: ShopifyProduct['node'];
  selectedVariant: {
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
  };
}

export const ProductSchema = ({ product, selectedVariant }: ProductSchemaProps) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@language": i18n.language,
      name: product.title,
      description: product.description || '',
      image: product.images.edges[0]?.node?.url || '',
      sku: selectedVariant.id.split('/').pop() || '',
      brand: {
        "@type": "Brand",
        name: "SEIJAKU"
      },
      offers: {
        "@type": "Offer",
        price: parseFloat(selectedVariant.price.amount).toFixed(2),
        priceCurrency: selectedVariant.price.currencyCode,
        availability: selectedVariant.availableForSale 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock",
        url: window.location.href,
        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      }
    };

    // Remove existing schema if present
    const existingSchema = document.getElementById('product-schema');
    if (existingSchema) {
      existingSchema.remove();
    }

    // Add new schema
    const script = document.createElement('script');
    script.id = 'product-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const schemaToRemove = document.getElementById('product-schema');
      if (schemaToRemove) {
        schemaToRemove.remove();
      }
    };
  }, [product, selectedVariant, i18n.language]);

  return null;
};
