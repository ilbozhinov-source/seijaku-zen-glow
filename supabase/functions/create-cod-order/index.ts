import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Correct NextLevel API endpoint for fulfillment orders
const NEXTLEVEL_API_BASE = 'https://api.nextlevel.delivery/v1/fulfillment';

// Map our courier codes to NextLevel courier names
function mapCourierService(courierCode: string | undefined, shippingMethod: string | undefined, country: string): { courier: string; service: string } {
  if (country === 'BG') {
    if (shippingMethod === 'sameday_box' || courierCode === 'Sameday') {
      return { courier: 'Sameday', service: 'easybox' };
    }
    if (courierCode === 'Econt' || shippingMethod?.includes('econt')) {
      return { courier: 'Econt', service: shippingMethod === 'to_office' ? 'office' : 'address' };
    }
    return { courier: 'Econt', service: 'address' };
  }
  
  if (country === 'GR') {
    return { courier: 'SpeedX', service: 'address' };
  }
  
  if (country === 'RO') {
    return { courier: 'FAN', service: 'address' };
  }
  
  return { courier: courierCode || 'Econt', service: 'address' };
}

async function sendToFulfillment(order: any, supabase: any): Promise<{ success: boolean; trackingNumber?: string; fulfillmentOrderId?: string; error?: string }> {
  try {
    const appId = Deno.env.get('NEXTLEVEL_APP_ID');
    const appSecret = Deno.env.get('NEXTLEVEL_APP_SECRET');

    if (!appId || !appSecret) {
      console.log('NextLevel API credentials not configured, skipping fulfillment');
      return { success: false, error: 'Fulfillment API credentials not configured' };
    }

    console.log('Sending COD order to NextLevel fulfillment:', order.id);

    // Map courier and service
    const { courier, service } = mapCourierService(order.courier_code, order.shipping_method, order.shipping_country || 'BG');

    // Prepare items for NextLevel API
    const items = Array.isArray(order.items) ? order.items.map((item: any, index: number) => ({
      sku: item.sku || `SKU-${index + 1}`,
      name: `${item.productTitle || item.title} - ${item.variantTitle || ''}`.trim(),
      quantity: item.quantity || 1,
      weight: 0.1,
      price: parseFloat(item.price?.amount || item.price || '0'),
    })) : [];

    // Build the payload according to NextLevel API structure
    // POST /v1/fulfillment/orders
    // API requires "products" field instead of "items"
    const payload = {
      order_id: order.id,
      external_id: order.id,
      receiver: {
        name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      country: order.shipping_country || 'BG',
      place: order.shipping_city,
      address: order.shipping_address,
      post_code: order.postal_code || '',
      office_id: order.courier_office_id || null
      },
      courier: courier,
      service: service,
      products: items,
      price: (order.total_with_shipping || order.total_amount) - (order.shipping_price || 0),
      currency: order.currency,
      note: `Поръчка от gomatcha.bg - ${order.id} (Наложен платеж)`,
      shipping_price: order.shipping_price || 0,
      total_amount: order.total_with_shipping || order.total_amount,
    };

    console.log('=== NextLevel Fulfillment Request (COD) ===');
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
      
      // Update order with error but don't fail the order creation
      await supabase
        .from('orders')
        .update({ 
          sent_to_fulfillment: false,
          fulfillment_error: `NextLevel API error: ${response.status}`
        })
        .eq('id', order.id);
        
      return { success: false, error: `NextLevel API error: ${response.status}` };
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse NextLevel response:', responseText);
      
      await supabase
        .from('orders')
        .update({ 
          sent_to_fulfillment: false,
          fulfillment_error: 'Invalid API response from NextLevel'
        })
        .eq('id', order.id);
        
      return { success: false, error: 'Invalid API response from NextLevel' };
    }

    // Extract tracking number and fulfillment order ID from response
    const trackingNumber = result.tracking_number || result.trackingNumber || result.awb || null;
    const fulfillmentOrderId = result.id || result.order_id || result.fulfillment_order_id || null;
    
    console.log('Order sent to fulfillment successfully.');
    console.log('Tracking Number:', trackingNumber);
    console.log('Fulfillment Order ID:', fulfillmentOrderId);

    // Update order with success status
    const updateData: any = {
      sent_to_fulfillment: true,
      fulfillment_error: null,
    };
    
    if (trackingNumber) {
      updateData.tracking_number = String(trackingNumber);
    }
    if (fulfillmentOrderId) {
      updateData.fulfillment_order_id = String(fulfillmentOrderId);
    }
    
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update order with fulfillment data:', updateError);
    } else {
      console.log('Order updated with fulfillment data:', updateData);
    }

    return { 
      success: true, 
      trackingNumber: trackingNumber ? String(trackingNumber) : undefined,
      fulfillmentOrderId: fulfillmentOrderId ? String(fulfillmentOrderId) : undefined,
    };
  } catch (error) {
    console.error('Fulfillment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown fulfillment error';
    
    // Update order with error
    await supabase
      .from('orders')
      .update({ 
        sent_to_fulfillment: false,
        fulfillment_error: errorMessage
      })
      .eq('id', order.id);
      
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, customer } = await req.json();
    
    console.log('Creating COD order', { itemsCount: items?.length, customer });

    if (!items || items.length === 0) {
      throw new Error('No items provided');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate total
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.price.amount) * item.quantity);
    }, 0);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        items: items,
        total_amount: totalAmount,
        currency: 'BGN',
        payment_method: 'cod',
        status: 'cod_pending',
        customer_name: customer?.name,
        customer_email: customer?.email,
        customer_phone: customer?.phone,
        phone_country_code: customer?.phoneCountryCode || null,
        phone_number: customer?.phoneNumber || null,
        shipping_address: customer?.address,
        shipping_city: customer?.city,
        postal_code: customer?.postalCode || null,
        shipping_country: customer?.shippingCountryCode,
        shipping_country_name: customer?.shippingCountryName,
        shipping_method: customer?.shippingMethod,
        shipping_price: customer?.shippingPrice || 0,
        total_with_shipping: customer?.totalWithShipping || totalAmount,
        courier_name: customer?.courierName || null,
        courier_code: customer?.courierCode || null,
        courier_office_id: customer?.courierOfficeId || null,
        courier_office_name: customer?.courierOfficeName || null,
        courier_office_address: customer?.courierOfficeAddress || null,
        courier_office_city: customer?.courierOfficeCity || null,
        courier_office_country_code: customer?.courierOfficeCountryCode || null,
        sent_to_fulfillment: false,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Failed to create order');
    }

    console.log('COD Order created:', order.id);

    // Send to fulfillment
    const fulfillmentResult = await sendToFulfillment(order, supabase);

    return new Response(JSON.stringify({ 
      orderId: order.id,
      status: 'cod_pending',
      trackingNumber: fulfillmentResult.trackingNumber || null,
      fulfillmentOrderId: fulfillmentResult.fulfillmentOrderId || null,
      sentToFulfillment: fulfillmentResult.success,
      fulfillmentError: fulfillmentResult.success ? null : fulfillmentResult.error,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('COD order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
