import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN') || 'seijaku-matcha.myshopify.com';
const SHOPIFY_STOREFRONT_TOKEN = Deno.env.get('SHOPIFY_STOREFRONT_ACCESS_TOKEN') || '';
const SITE_URL = Deno.env.get('SITE_URL') || 'https://seijaku-matcha.lovable.app';

const LANGUAGES = ['bg', 'en', 'el', 'ro'];

interface Product {
  handle: string;
  updatedAt: string;
}

const PRODUCTS_QUERY = `
  query GetProducts {
    products(first: 250) {
      edges {
        node {
          handle
          updatedAt
        }
      }
    }
  }
`;

async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: PRODUCTS_QUERY }),
    });

    const data = await response.json();
    return data.data?.products?.edges?.map((edge: any) => edge.node) || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

function generateAlternateLinks(path: string): string {
  return LANGUAGES.map(lang => 
    `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}${path}?lang=${lang}" />`
  ).join('\n');
}

function generateUrlEntry(loc: string, lastmod: string, changefreq: string, priority: string, path: string): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${generateAlternateLinks(path)}
  </url>`;
}

serve(async (req) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const products = await fetchProducts();
    const now = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Add homepage
    sitemap += generateUrlEntry(
      `${SITE_URL}/`,
      now,
      'daily',
      '1.0',
      '/'
    ) + '\n';

    // Add product pages
    products.forEach(product => {
      const lastmod = new Date(product.updatedAt).toISOString().split('T')[0];
      const productPath = `/product/${product.handle}`;
      
      sitemap += generateUrlEntry(
        `${SITE_URL}${productPath}`,
        lastmod,
        'weekly',
        '0.8',
        productPath
      ) + '\n';
    });

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
});
