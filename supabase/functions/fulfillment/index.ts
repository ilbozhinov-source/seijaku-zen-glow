import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEXTLEVEL_API_BASE = 'https://api.nextlevel.delivery/v1/fulfillment';

interface OrderItem {
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: { amount: string; currencyCode: string };
}

interface FulfillmentOrder {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  shippingOfficeId?: string;
  courierName?: string;
  courierCode?: string;
  items: OrderItem[];
  totalAmount: number;
  shippingPrice: number;
  totalWithShipping: number;
  currency: string;
}

// Fetch countries from NextLevel API
async function fetchCountries(): Promise<{ success: boolean; data?: any; error?: string }> {
  const appId = Deno.env.get('FULFILLMENT_APP_ID');
  const appSecret = Deno.env.get('FULFILLMENT_APP_SECRET');

  if (!appId || !appSecret) {
    console.error('NextLevel credentials not configured');
    return { success: false, error: 'Fulfillment credentials not configured' };
  }

  try {
    console.log('Fetching countries from NextLevel API...');
    
    const response = await fetch(`${NEXTLEVEL_API_BASE}/countries`, {
      method: 'GET',
      headers: {
        'app-id': appId,
        'app-secret': appSecret,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NextLevel API error:', response.status, errorText);
      return { success: false, error: `API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    console.log('Countries fetched successfully:', data);
    
    return { success: true, data };
  } catch (error: unknown) {
    console.error('NextLevel API request failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// Fetch offices for a country from NextLevel API
// API docs: GET https://api.nextlevel.delivery/v1/fulfillment/offices/
// Params: country (BG/GR/RO), place (city), post_code
async function fetchOffices(countryCode: string, place?: string, postCode?: string): Promise<{ success: boolean; offices: any[]; error?: string }> {
  const appId = Deno.env.get('FULFILLMENT_APP_ID');
  const appSecret = Deno.env.get('FULFILLMENT_APP_SECRET');

  if (!appId || !appSecret) {
    console.error('NextLevel credentials not configured');
    return { success: false, offices: [], error: 'Fulfillment credentials not configured' };
  }

  try {
    console.log('Fetching offices for country:', countryCode, 'place:', place, 'post_code:', postCode);
    
    // Build query parameters as per NextLevel API docs
    const params = new URLSearchParams();
    params.append('country', countryCode);
    if (place) params.append('place', place);
    if (postCode) params.append('post_code', postCode);
    
    const url = `${NEXTLEVEL_API_BASE}/offices/?${params.toString()}`;
    console.log('Calling NextLevel API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'app-id': appId,
        'app-secret': appSecret,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log('NextLevel API response status:', response.status);
    
    if (!response.ok) {
      console.error('NextLevel offices API error:', response.status, responseText);
      return { success: false, offices: [], error: `API error: ${response.status}` };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse NextLevel response:', responseText);
      return { success: false, offices: [], error: 'Invalid API response' };
    }
    
    console.log('NextLevel raw response type:', typeof data, Array.isArray(data) ? `array of ${data.length}` : 'not array');
    
    // Map API response to our standardized format
    // NextLevel returns array of offices with: id, name, place (city), post_code, address, country
    if (Array.isArray(data)) {
      const mappedOffices = data.map((office: any) => ({
        id: office.id?.toString() || '',
        name: office.name || '',
        place: office.place || office.city || '',
        post_code: office.post_code || office.postcode || '',
        address: office.address || '',
        country: office.country || countryCode,
      }));
      console.log('Mapped offices count:', mappedOffices.length);
      return { success: true, offices: mappedOffices };
    }
    
    // If response has a data array property
    if (data?.data && Array.isArray(data.data)) {
      const mappedOffices = data.data.map((office: any) => ({
        id: office.id?.toString() || '',
        name: office.name || '',
        place: office.place || office.city || '',
        post_code: office.post_code || office.postcode || '',
        address: office.address || '',
        country: office.country || countryCode,
      }));
      console.log('Mapped offices from data property, count:', mappedOffices.length);
      return { success: true, offices: mappedOffices };
    }
    
    console.log('Unexpected response format, returning empty offices');
    return { success: true, offices: [] };
  } catch (error: unknown) {
    console.error('NextLevel offices API request failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, offices: [], error: message };
  }
}

async function sendOrderToFulfillment(order: FulfillmentOrder): Promise<{ success: boolean; trackingNumber?: string; error?: string }> {
  const appId = Deno.env.get('FULFILLMENT_APP_ID');
  const appSecret = Deno.env.get('FULFILLMENT_APP_SECRET');

  if (!appId || !appSecret) {
    console.error('Fulfillment credentials not configured');
    return { success: false, error: 'Fulfillment credentials not configured' };
  }

  console.log('Sending order to fulfillment API:', order.orderId);

  // Prepare the payload for the fulfillment API
  const payload = {
    order_id: order.orderId,
    recipient: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.shippingAddress,
      city: order.shippingCity,
      country: order.shippingCountry,
      office_id: order.shippingOfficeId,
    },
    courier: {
      name: order.courierName,
      code: order.courierCode,
    },
    items: order.items.map(item => ({
      name: item.productTitle,
      variant: item.variantTitle,
      quantity: item.quantity,
      price: parseFloat(item.price.amount),
      currency: item.price.currencyCode,
    })),
    total_amount: order.totalAmount,
    shipping_price: order.shippingPrice,
    total_with_shipping: order.totalWithShipping,
    currency: order.currency,
  };

  try {
    console.log('Fulfillment payload prepared:', JSON.stringify(payload, null, 2));

    // TODO: Uncomment when ready to connect to real API:
    /*
    const response = await fetch(`${NEXTLEVEL_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'app-id': appId,
        'app-secret': appSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fulfillment API error:', response.status, errorText);
      return { success: false, error: `API error: ${response.status}` };
    }

    const result = await response.json();
    console.log('Fulfillment API response:', result);
    
    return { 
      success: true, 
      trackingNumber: result.tracking_number 
    };
    */

    // Mock response for testing
    const mockTrackingNumber = `NXL-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    console.log('Mock tracking number generated:', mockTrackingNumber);
    
    return { 
      success: true, 
      trackingNumber: mockTrackingNumber 
    };

  } catch (error: unknown) {
    console.error('Fulfillment API request failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Fetch countries from NextLevel API
    if (action === 'countries') {
      console.log('Fetching countries...');
      const result = await fetchCountries();
      
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch offices for a country
    // Params: country (BG/GR/RO), place (city), post_code
    if (action === 'offices') {
      const countryCode = url.searchParams.get('country');
      const place = url.searchParams.get('place') || undefined;
      const postCode = url.searchParams.get('post_code') || undefined;
      
      if (!countryCode) {
        return new Response(JSON.stringify({ success: false, error: 'Country code is required', offices: [] }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Fetching offices for country:', countryCode, 'place:', place, 'post_code:', postCode);
      const result = await fetchOffices(countryCode, place, postCode);
      
      // Return standardized format: { success, offices, error? }
      return new Response(JSON.stringify({
        success: result.success,
        offices: result.offices,
        error: result.error || undefined,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test endpoint
    if (action === 'test') {
      console.log('Testing fulfillment integration...');
      
      const appId = Deno.env.get('FULFILLMENT_APP_ID');
      const appSecret = Deno.env.get('FULFILLMENT_APP_SECRET');
      
      const testOrder: FulfillmentOrder = {
        orderId: 'TEST-' + Date.now(),
        customerName: 'Тест Клиент',
        customerEmail: 'test@example.com',
        customerPhone: '+359888123456',
        shippingAddress: 'ул. Тестова 1',
        shippingCity: 'София',
        shippingCountry: 'BG',
        items: [{
          productTitle: 'SEIJAKU Церемониална Матча',
          variantTitle: '30g',
          quantity: 1,
          price: { amount: '28.00', currencyCode: 'BGN' }
        }],
        totalAmount: 28.00,
        shippingPrice: 5.00,
        totalWithShipping: 33.00,
        currency: 'BGN'
      };

      const result = await sendOrderToFulfillment(testOrder);
      
      return new Response(JSON.stringify({
        test: true,
        credentialsConfigured: !!(appId && appSecret),
        appIdSet: !!appId,
        appSecretSet: !!appSecret,
        result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send order to fulfillment
    if (req.method === 'POST') {
      const { orderId } = await req.json();
      
      if (!orderId) {
        return new Response(JSON.stringify({ error: 'Order ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Processing fulfillment for order:', orderId);

      // Fetch order from database
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Order not found:', orderError);
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const fulfillmentOrder: FulfillmentOrder = {
        orderId: order.id,
        customerName: order.customer_name || '',
        customerEmail: order.customer_email || '',
        customerPhone: order.customer_phone || '',
        shippingAddress: order.shipping_address || '',
        shippingCity: order.shipping_city || '',
        shippingCountry: order.shipping_country || 'BG',
        courierName: order.courier_name || undefined,
        courierCode: order.courier_code || undefined,
        items: order.items as OrderItem[],
        totalAmount: order.total_amount,
        shippingPrice: order.shipping_price || 0,
        totalWithShipping: order.total_with_shipping || order.total_amount,
        currency: order.currency,
      };

      const result = await sendOrderToFulfillment(fulfillmentOrder);

      if (result.success && result.trackingNumber) {
        // Update order with tracking number
        await supabase
          .from('orders')
          .update({ tracking_number: result.trackingNumber })
          .eq('id', orderId);
        console.log('Order sent to fulfillment successfully. Tracking:', result.trackingNumber);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Fulfillment function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
