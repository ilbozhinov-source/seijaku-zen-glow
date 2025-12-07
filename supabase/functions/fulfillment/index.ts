import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Correct NextLevel API endpoint for fulfillment orders
const NEXTLEVEL_API_BASE = 'https://api.nextlevel.delivery/v1/fulfillment';

interface OrderItem {
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: { amount: string; currencyCode: string };
  sku?: string;
}

interface FulfillmentOrder {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  postalCode?: string;
  shippingOfficeId?: string;
  courierName?: string;
  courierCode?: string;
  shippingMethod?: string;
  items: OrderItem[];
  totalAmount: number;
  shippingPrice: number;
  totalWithShipping: number;
  currency: string;
  paymentMethod: string;
}

// Map our courier codes to NextLevel courier names
function mapCourierService(courierCode: string | undefined, shippingMethod: string | undefined, country: string): { courier: string; service: string } {
  // Default mapping based on country and shipping method
  if (country === 'BG') {
    if (shippingMethod === 'sameday_box' || courierCode === 'Sameday') {
      return { courier: 'Sameday', service: 'easybox' };
    }
    if (courierCode === 'Econt' || shippingMethod?.includes('econt')) {
      return { courier: 'Econt', service: shippingMethod === 'to_office' ? 'office' : 'address' };
    }
    // Default to Econt for Bulgaria
    return { courier: 'Econt', service: 'address' };
  }
  
  if (country === 'GR') {
    return { courier: 'SpeedX', service: 'address' };
  }
  
  if (country === 'RO') {
    return { courier: 'FAN', service: 'address' };
  }
  
  // Default
  return { courier: courierCode || 'Econt', service: 'address' };
}

// Fetch countries from NextLevel API
async function fetchCountries(): Promise<{ success: boolean; data?: any; error?: string }> {
  const appId = Deno.env.get('NEXTLEVEL_APP_ID');
  const appSecret = Deno.env.get('NEXTLEVEL_APP_SECRET');

  if (!appId || !appSecret) {
    console.error('NextLevel API credentials not configured');
    return { success: false, error: 'Fulfillment API credentials not configured' };
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
async function fetchOffices(
  countryCode: string, 
  place?: string, 
  postCode?: string,
  courier?: string,
  filterMachines?: boolean
): Promise<{ success: boolean; offices: any[]; error?: string }> {
  const appId = Deno.env.get('NEXTLEVEL_APP_ID');
  const appSecret = Deno.env.get('NEXTLEVEL_APP_SECRET');

  if (!appId || !appSecret) {
    console.error('NextLevel API credentials not configured');
    return { success: false, offices: [], error: 'Fulfillment API credentials not configured' };
  }

  try {
    console.log('Fetching offices for country:', countryCode, 'place:', place, 'post_code:', postCode, 'courier:', courier);
    
    const params = new URLSearchParams();
    params.append('country', countryCode);
    if (place) params.append('place', place);
    if (postCode) params.append('post_code', postCode);
    if (courier) params.append('courier', courier);
    
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
    
    let officesArray: any[] = [];
    
    if (Array.isArray(data)) {
      officesArray = data;
    } else if (data?.data && Array.isArray(data.data)) {
      officesArray = data.data;
    }
    
    if (filterMachines) {
      officesArray = officesArray.filter((office: any) => office.is_machine === true);
      console.log('Filtered to machines only, count:', officesArray.length);
    }
    
    const mappedOffices = officesArray.map((office: any) => ({
      id: office.id?.toString() || '',
      name: office.name || '',
      place: office.place || office.city || '',
      post_code: office.post_code || office.postcode || '',
      address: office.street && office.street_num 
        ? `${office.street} ${office.street_num}` 
        : (office.address || ''),
      country: office.country || countryCode,
      is_machine: office.is_machine || false,
    }));
    
    console.log('Mapped offices count:', mappedOffices.length);
    return { success: true, offices: mappedOffices };
  } catch (error: unknown) {
    console.error('NextLevel offices API request failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, offices: [], error: message };
  }
}

// Send order to NextLevel Fulfillment API
// Endpoint: POST https://api.nextlevel.delivery/v1/fulfillment/orders
async function sendOrderToFulfillment(order: FulfillmentOrder): Promise<{ 
  success: boolean; 
  trackingNumber?: string; 
  fulfillmentOrderId?: string; 
  error?: string 
}> {
  const appId = Deno.env.get('NEXTLEVEL_APP_ID');
  const appSecret = Deno.env.get('NEXTLEVEL_APP_SECRET');

  if (!appId || !appSecret) {
    console.error('Fulfillment API credentials not configured');
    return { success: false, error: 'Fulfillment API credentials not configured' };
  }

  console.log('Sending order to NextLevel fulfillment API:', order.orderId);

  // Map courier and service based on order details
  const { courier, service } = mapCourierService(order.courierCode, order.shippingMethod, order.shippingCountry);

  // Prepare items for NextLevel API
  const items = order.items.map((item, index) => ({
    sku: item.sku || `SKU-${index + 1}`,
    name: `${item.productTitle} - ${item.variantTitle}`.trim(),
    quantity: item.quantity,
    weight: 0.1, // Default weight in kg for matcha
    price: parseFloat(item.price.amount),
  }));

  // Build the payload according to NextLevel API structure
  // POST /v1/fulfillment/orders
  // API requires "products" field instead of "items"
  const payload = {
    // Order ID (NextLevel requires "order_id")
    order_id: order.orderId,
    external_id: order.orderId,
    
    // Receiver information
    receiver_name: order.customerName,
    receiver_phone: order.customerPhone,
    receiver_email: order.customerEmail,
    receiver_country: order.shippingCountry,
    receiver_city: order.shippingCity,
    receiver_address: order.shippingAddress,
    receiver_postcode: order.postalCode || '',
    
    // Courier and service
    courier_name: courier,
    service: service,
    
    // Office delivery (if applicable)
    office_id: order.shippingOfficeId || null,
    
    // Products (NextLevel uses "products" not "items")
    products: items,
    
    // Payment and COD
    cod_amount: order.paymentMethod === 'cod' ? order.totalWithShipping : 0,
    currency: order.currency,
    
    // Additional info
    comment: `Поръчка от gomatcha.bg - ${order.orderId}`,
    
    // Shipping price
    shipping_price: order.shippingPrice,
    total_amount: order.totalWithShipping,
  };

  try {
    console.log('=== NextLevel Fulfillment Request ===');
    console.log('URL: POST', `${NEXTLEVEL_API_BASE}/orders`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${NEXTLEVEL_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'app-id': appId,
        'app-secret': appSecret,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('=== NextLevel Fulfillment Response ===');
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
    console.log('Body:', responseText);

    if (!response.ok) {
      console.error('NextLevel Fulfillment API error:', response.status, responseText);
      return { 
        success: false, 
        error: `NextLevel API error: ${response.status}` 
      };
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse NextLevel response:', responseText);
      return { success: false, error: 'Invalid API response from NextLevel' };
    }
    
    console.log('NextLevel Fulfillment API response parsed:', result);
    
    // Extract tracking number and fulfillment order ID from response
    const trackingNumber = result.tracking_number || result.trackingNumber || result.awb || null;
    const fulfillmentOrderId = result.id || result.order_id || result.fulfillment_order_id || null;
    
    console.log('Order sent to fulfillment successfully.');
    console.log('Tracking Number:', trackingNumber);
    console.log('Fulfillment Order ID:', fulfillmentOrderId);
    
    return { 
      success: true, 
      trackingNumber: trackingNumber ? String(trackingNumber) : undefined,
      fulfillmentOrderId: fulfillmentOrderId ? String(fulfillmentOrderId) : undefined,
    };

  } catch (error: unknown) {
    console.error('NextLevel Fulfillment API request failed:', error);
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
    if (action === 'offices') {
      const countryCode = url.searchParams.get('country');
      const place = url.searchParams.get('place') || undefined;
      const postCode = url.searchParams.get('post_code') || undefined;
      const courier = url.searchParams.get('courier') || undefined;
      const machinesOnly = url.searchParams.get('machines_only') === 'true';
      
      if (!countryCode) {
        return new Response(JSON.stringify({ success: false, error: 'Country code is required', offices: [] }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Fetching offices for country:', countryCode, 'place:', place, 'post_code:', postCode, 'courier:', courier, 'machines_only:', machinesOnly);
      const result = await fetchOffices(countryCode, place, postCode, courier, machinesOnly);
      
      return new Response(JSON.stringify({
        success: result.success,
        offices: result.offices,
        error: result.error || undefined,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch Sameday easybox lockers (machines) for Bulgaria
    if (action === 'sameday-boxes') {
      const place = url.searchParams.get('place') || undefined;
      
      console.log('Fetching Sameday easybox lockers, place:', place);
      const result = await fetchOffices('BG', place, undefined, 'Sameday', true);
      
      const cities = [...new Set(result.offices.map((o: any) => o.place))].filter(Boolean).sort();
      
      return new Response(JSON.stringify({
        success: result.success,
        boxes: result.offices,
        cities: cities,
        error: result.error || undefined,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test endpoint
    if (action === 'test') {
      console.log('Testing fulfillment integration...');
      
      const appId = Deno.env.get('NEXTLEVEL_APP_ID');
      const appSecret = Deno.env.get('NEXTLEVEL_APP_SECRET');
      
      const testOrder: FulfillmentOrder = {
        orderId: 'TEST-' + Date.now(),
        customerName: 'Тест Клиент',
        customerEmail: 'test@example.com',
        customerPhone: '+359888123456',
        shippingAddress: 'ул. Тестова 1',
        shippingCity: 'София',
        shippingCountry: 'BG',
        postalCode: '1000',
        shippingMethod: 'to_address',
        items: [{
          productTitle: 'SEIJAKU Церемониална Матча',
          variantTitle: '30g',
          quantity: 1,
          price: { amount: '28.00', currencyCode: 'BGN' }
        }],
        totalAmount: 28.00,
        shippingPrice: 6.00,
        totalWithShipping: 34.00,
        currency: 'BGN',
        paymentMethod: 'cod',
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
        postalCode: order.postal_code || '',
        shippingOfficeId: order.courier_office_id || undefined,
        courierName: order.courier_name || undefined,
        courierCode: order.courier_code || undefined,
        shippingMethod: order.shipping_method || undefined,
        items: order.items as OrderItem[],
        totalAmount: order.total_amount,
        shippingPrice: order.shipping_price || 0,
        totalWithShipping: order.total_with_shipping || order.total_amount,
        currency: order.currency,
        paymentMethod: order.payment_method,
      };

      const result = await sendOrderToFulfillment(fulfillmentOrder);

      // Update order with fulfillment status
      const updateData: any = {
        sent_to_fulfillment: result.success,
      };
      
      if (result.success) {
        if (result.trackingNumber) {
          updateData.tracking_number = result.trackingNumber;
        }
        if (result.fulfillmentOrderId) {
          updateData.fulfillment_order_id = result.fulfillmentOrderId;
        }
        updateData.fulfillment_error = null;
      } else {
        updateData.fulfillment_error = result.error || 'Unknown fulfillment error';
      }
      
      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
        
      if (updateError) {
        console.error('Failed to update order fulfillment status:', updateError);
      } else {
        console.log('Order fulfillment status updated:', updateData);
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
