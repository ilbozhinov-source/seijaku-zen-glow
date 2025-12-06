import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEXTLEVEL_API_BASE = 'https://api.nextlevel.delivery/v1/fulfillment';

async function sendToFulfillment(order: any, supabase: any): Promise<string | null> {
  try {
    const appId = Deno.env.get('FULFILLMENT_APP_ID');
    const appSecret = Deno.env.get('FULFILLMENT_APP_SECRET');

    if (!appId || !appSecret) {
      console.log('Fulfillment credentials not configured, skipping');
      return null;
    }

    console.log('Sending COD order to NextLevel fulfillment:', order.id);

    // Prepare items for NextLevel API
    const offerItems = Array.isArray(order.items) ? order.items.map((item: any) => ({
      name: `${item.productTitle || item.title} - ${item.variantTitle || ''}`.trim(),
      quantity: item.quantity || 1,
      price: parseFloat(item.price?.amount || item.price || '0'),
    })) : [];

    // Prepare the payload for NextLevel offers API
    const payload = {
      external_id: order.id,
      recipient_name: order.customer_name,
      recipient_phone: order.customer_phone,
      recipient_email: order.customer_email,
      recipient_country: order.shipping_country || 'BG',
      recipient_city: order.shipping_city,
      recipient_address: order.shipping_address,
      recipient_office_id: order.courier_office_id || null,
      courier: order.courier_code || null,
      items: offerItems,
      // COD amount for cash on delivery orders
      cod_amount: order.total_with_shipping || order.total_amount,
      currency: order.currency,
      comment: `Поръчка от gomatcha.bg - ${order.id} (Наложен платеж)`,
    };

    console.log('NextLevel payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${NEXTLEVEL_API_BASE}/offers`, {
      method: 'POST',
      headers: {
        'app-id': appId,
        'app-secret': appSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('NextLevel API response status:', response.status);
    console.log('NextLevel API response body:', responseText);

    if (!response.ok) {
      console.error('NextLevel API error:', response.status, responseText);
      return null;
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse NextLevel response:', responseText);
      return null;
    }

    // NextLevel returns offer/tracking number
    const trackingNumber = result.tracking_number || result.trackingNumber || result.number || null;
    console.log('NextLevel tracking number:', trackingNumber);

    // Update order with tracking number
    if (trackingNumber) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber })
        .eq('id', order.id);

      if (updateError) {
        console.error('Failed to update order with tracking:', updateError);
      } else {
        console.log('Order updated with tracking number:', trackingNumber);
      }
    }

    return trackingNumber;
  } catch (error) {
    console.error('Fulfillment error:', error);
    return null;
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
        customer_phone: customer?.phone, // Full phone with country code
        phone_country_code: customer?.phoneCountryCode || null,
        phone_number: customer?.phoneNumber || null,
        shipping_address: customer?.address,
        shipping_city: customer?.city,
        // Shipping country info
        shipping_country: customer?.shippingCountryCode,
        shipping_country_name: customer?.shippingCountryName,
        // Shipping method and pricing
        shipping_method: customer?.shippingMethod,
        shipping_price: customer?.shippingPrice || 0,
        total_with_shipping: customer?.totalWithShipping || totalAmount,
        // Courier info
        courier_name: customer?.courierName || null,
        courier_code: customer?.courierCode || null,
        // Courier office info (only for office delivery)
        courier_office_id: customer?.courierOfficeId || null,
        courier_office_name: customer?.courierOfficeName || null,
        courier_office_address: customer?.courierOfficeAddress || null,
        courier_office_city: customer?.courierOfficeCity || null,
        courier_office_country_code: customer?.courierOfficeCountryCode || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Failed to create order');
    }

    console.log('COD Order created:', order.id);

    // Send to fulfillment and get tracking number
    const trackingNumber = await sendToFulfillment(order, supabase);

    return new Response(JSON.stringify({ 
      orderId: order.id,
      status: 'cod_pending',
      trackingNumber: trackingNumber,
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
