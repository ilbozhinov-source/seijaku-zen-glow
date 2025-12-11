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
    return { courier: 'Speedex', service: 'address' };
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

    console.log('=======================================================');
    console.log('=== COD FULFILLMENT REQUEST START ===');
    console.log('=======================================================');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Order ID:', order.id);

    // Determine country and currency
    const country = order.shipping_country || 'BG';
    let currency = 'BGN';
    if (country === 'GR') currency = 'EUR';
    if (country === 'RO') currency = 'EUR'; // Romania also uses EUR for our pricing

    // Fixed EUR price for Greece and Romania
    const EUR_PRICE = 14.99;

    // Map courier based on country and shipping method
    const { courier } = mapCourierService(order.courier_code, order.shipping_method, country);

    // Calculate products subtotal (price without shipping)
    const items = Array.isArray(order.items) ? order.items : [];
    let productsTotal = 0;
    const products = items.map((item: any) => {
      const quantity = item.quantity || 1;
      // Use fixed EUR price for GR/RO, BGN price for BG
      const unitPrice = (country === 'GR' || country === 'RO') 
        ? EUR_PRICE 
        : parseFloat(item.price?.amount || item.price || '0');
      productsTotal += unitPrice * quantity;
      return {
        sku: '3800503047000', // Barcode for SEIJAKU Matcha
        name: `${item.productTitle || item.title || 'Product'} ${item.variantTitle ? `- ${item.variantTitle}` : ''}`.trim(),
        quantity: quantity,
        unit_price: unitPrice,
        variant: item.variantTitle || null,
        is_digital: null,
        weight: 0.05,
        discount_type: null,
        discount_value: null,
      };
    });

    // Format created_at for NextLevel
    const createdAt = order.created_at 
      ? new Date(order.created_at).toISOString().replace('T', ' ').substring(0, 19)
      : new Date().toISOString().replace('T', ' ').substring(0, 19);

    // COD amount = total with shipping (customer pays on delivery)
    const codAmount = order.total_with_shipping || (productsTotal + (order.shipping_price || 0));

    // Build payload according to NextLevel API structure (same as test that works!)
    const payload = {
      order_id: order.id,
      cod: codAmount, // COD payment - customer pays this on delivery
      price: productsTotal,
      currency: currency,
      shipping_price: order.shipping_price ? order.shipping_price.toFixed(2) : "0.00",
      ref: order.order_number || order.id, // Use our order_number for tracking
      courier: courier,
      discount_type: null,
      discount_value: null,
      is_paid: 0, // COD - not paid yet
      is_shipping_free: order.shipping_price === 0 ? 1 : 0,
      receiver: {
        name: order.customer_name || '',
        phone: order.customer_phone || '',
        office_id: order.courier_office_id ? parseInt(order.courier_office_id) : null,
        country: country,
        email: order.customer_email || '',
        place: order.shipping_city || '',
        post_code: order.postal_code || '',
        street: order.shipping_address || '',
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

    console.log('FULFILLMENT REQUEST BODY:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('=======================================================');

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
    
    console.log('=======================================================');
    console.log('=== COD FULFILLMENT RESPONSE ===');
    console.log('=======================================================');
    console.log('FULFILLMENT RESPONSE STATUS:', response.status);
    console.log('FULFILLMENT RESPONSE DATA:', responseText);
    console.log('=======================================================');

    if (!response.ok) {
      console.error('=== COD FULFILLMENT ERROR: API returned non-OK status ===');
      console.error('Status Code:', response.status);
      console.error('Response Body:', responseText);
      
      await supabase
        .from('orders')
        .update({ 
          sent_to_fulfillment: false,
          fulfillment_error: `NextLevel API error: ${response.status} - ${responseText.substring(0, 200)}`
        })
        .eq('id', order.id);
        
      return { success: false, error: `NextLevel API error: ${response.status}` };
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('=== COD FULFILLMENT ERROR: Failed to parse JSON response ===');
      console.error('Parse Error:', parseErr);
      
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
    
    console.log('=== COD FULFILLMENT SUCCESS ===');
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
    console.error('=======================================================');
    console.error('=== COD FULFILLMENT ERROR: Exception thrown ===');
    console.error('=======================================================');
    console.error('FULFILLMENT ERROR:', error);
    console.error('Error Message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('=======================================================');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown fulfillment error';
    
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

    // Determine country and currency based on shipping
    const country = customer?.shippingCountryCode || 'BG';
    let currency = 'BGN';
    if (country === 'GR') currency = 'EUR';
    if (country === 'RO') currency = 'EUR'; // Romania also uses EUR for our pricing

    // Fixed EUR price for Greece and Romania
    const EUR_PRICE = 14.99;

    // Calculate total based on country
    // For GR/RO: use fixed EUR price
    // For BG: use BGN price from cart
    const totalAmount = items.reduce((sum: number, item: any) => {
      if (country === 'GR' || country === 'RO') {
        return sum + (EUR_PRICE * item.quantity);
      }
      return sum + (parseFloat(item.price.amount) * item.quantity);
    }, 0);

    // Generate order number (first 8 chars of UUID)
    const orderId = crypto.randomUUID();
    const orderNumber = orderId.slice(0, 8);

    // Calculate total with shipping
    const shippingPrice = customer?.shippingPrice || 0;
    const totalWithShipping = totalAmount + shippingPrice;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        order_number: orderNumber,
        items: items,
        total_amount: totalAmount,
        currency: currency,
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
        shipping_price: shippingPrice,
        total_with_shipping: totalWithShipping,
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
      orderNumber: order.order_number,
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
