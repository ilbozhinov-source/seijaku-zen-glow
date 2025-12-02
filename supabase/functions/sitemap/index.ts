import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = Deno.env.get('SITE_URL') || 'https://gomatcha.bg';

const LANGUAGES = ['bg', 'en', 'el', 'ro'];

// Local product data for sitemap
const products = [
  {
    handle: 'seijaku-ceremonial-matcha',
    updatedAt: new Date().toISOString(),
  },
];

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

    // Add static pages
    const staticPages = [
      { path: '/story', priority: '0.7' },
      { path: '/quality', priority: '0.7' },
      { path: '/reviews', priority: '0.6' },
      { path: '/faq', priority: '0.6' },
      { path: '/contact', priority: '0.6' },
      { path: '/delivery', priority: '0.5' },
      { path: '/returns', priority: '0.5' },
      { path: '/privacy', priority: '0.3' },
      { path: '/terms', priority: '0.3' },
      { path: '/cookies', priority: '0.3' },
    ];

    staticPages.forEach(page => {
      sitemap += generateUrlEntry(
        `${SITE_URL}${page.path}`,
        now,
        'weekly',
        page.priority,
        page.path
      ) + '\n';
    });

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
