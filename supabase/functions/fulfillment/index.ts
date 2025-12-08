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

  // Map courier based on country
  const { courier } = mapCourierService(order.courierCode, order.shippingMethod, order.shippingCountry);

  // Calculate products price (sum of unit_price * quantity)
  const productsPrice = order.items.reduce((sum, item) => {
    return sum + (parseFloat(item.price.amount) * item.quantity);
  }, 0);

  // Map currency based on country
  const currencyMap: Record<string, string> = {
    'BG': 'BGN',
    'GR': 'EUR',
    'RO': 'RON',
  };
  const currency = currencyMap[order.shippingCountry] || order.currency || 'BGN';

  // Determine COD amount (if payment is COD, use totalWithShipping)
  const codAmount = order.paymentMethod === 'cod' ? order.totalWithShipping : 0;
  
  // Determine is_paid (1 if card payment, 0 if COD)
  const isPaid = order.paymentMethod === 'card' || order.paymentMethod === 'stripe' ? 1 : 0;
  
  // Determine is_shipping_free
  const isShippingFree = order.shippingPrice === 0 ? 1 : 0;

  // Format shipping price as string with 2 decimals
  const shippingPriceFormatted = order.shippingPrice.toFixed(2);

  // Format created_at as "YYYY-MM-DD HH:mm:ss"
  const now = new Date();
  const createdAt = now.toISOString().replace('T', ' ').substring(0, 19);

  // Prepare products array for NextLevel API
  const products = order.items.map((item, index) => ({
    sku: item.sku || `MATCHA-${order.shippingCountry}-${index + 1}`,
    name: item.variantTitle 
      ? `${item.productTitle} - ${item.variantTitle}`.trim()
      : item.productTitle,
    quantity: item.quantity,
    unit_price: parseFloat(item.price.amount),
    variant: item.variantTitle || null,
    is_digital: null,
    weight: 0.05, // 30g matcha = 0.03kg, with packaging ~0.05kg
    discount_type: null,
    discount_value: null,
  }));

  // Build the payload according to NextLevel API exact structure
  const payload = {
    order_id: order.orderId,
    cod: codAmount,
    price: productsPrice,
    currency: currency,
    shipping_price: shippingPriceFormatted,
    ref: order.orderId,
    courier: courier,
    discount_type: null,
    discount_value: null,
    is_paid: isPaid,
    is_shipping_free: isShippingFree,
    receiver: {
      name: order.customerName,
      phone: order.customerPhone,
      office_id: order.shippingOfficeId ? parseInt(order.shippingOfficeId, 10) : null,
      country: order.shippingCountry,
      email: order.customerEmail,
      place: order.shippingCity,
      post_code: order.postalCode || '',
      street: order.shippingAddress,
      street_no: null,
      complex: null,
      block_no: null,
      entrance_no: null,
      floor_no: null,
      apartment_no: null,
    },
    products: products,
    note: null,
    created_at: createdAt,
  };

  try {
    console.log('=== NextLevel ORDER REQUEST ===');
    console.log(JSON.stringify(payload, null, 2));

    const response = await fetch(`${NEXTLEVEL_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'app-id': appId,
        'app-secret': appSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('=== NextLevel ORDER RESPONSE ===');
    console.log('Status:', response.status);
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
