import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Country to language/shipping country mapping
const COUNTRY_CONFIG: Record<string, { lang: string; shippingCountry: string; phoneCode: string }> = {
  'BG': { lang: 'bg', shippingCountry: 'BG', phoneCode: '+359' },
  'GR': { lang: 'el', shippingCountry: 'GR', phoneCode: '+30' },
  'RO': { lang: 'ro', shippingCountry: 'RO', phoneCode: '+40' },
};

const DEFAULT_CONFIG = { lang: 'en', shippingCountry: 'BG', phoneCode: '+359' };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try to get country from Cloudflare headers (available when deployed on Supabase/Cloudflare)
    const cfCountry = req.headers.get('cf-ipcountry');
    const xCountry = req.headers.get('x-country');
    
    // Get client IP for logging
    const clientIp = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     'unknown';
    
    console.log('GeoIP request from IP:', clientIp, 'CF-Country:', cfCountry, 'X-Country:', xCountry);
    
    let detectedCountry = cfCountry || xCountry || null;
    
    // If no country from headers, try a free GeoIP API as fallback
    if (!detectedCountry && clientIp !== 'unknown') {
      try {
        // Using ip-api.com free tier (no API key needed, 45 requests/minute)
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=countryCode`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.countryCode) {
            detectedCountry = geoData.countryCode;
            console.log('GeoIP API returned country:', detectedCountry);
          }
        }
      } catch (geoError) {
        console.log('GeoIP API fallback failed:', geoError);
      }
    }
    
    // Get config for detected country or default
    const countryCode = detectedCountry?.toUpperCase() || '';
    const config = COUNTRY_CONFIG[countryCode] || DEFAULT_CONFIG;
    
    const result = {
      success: true,
      detectedCountry: countryCode || null,
      lang: config.lang,
      shippingCountry: config.shippingCountry,
      phoneCode: config.phoneCode,
      isSupported: !!COUNTRY_CONFIG[countryCode],
    };
    
    console.log('GeoIP result:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('GeoIP function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to detect location',
      lang: DEFAULT_CONFIG.lang,
      shippingCountry: DEFAULT_CONFIG.shippingCountry,
      phoneCode: DEFAULT_CONFIG.phoneCode,
      isSupported: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
