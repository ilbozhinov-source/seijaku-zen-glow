import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendToFulfillment(order: any, supabase: any): Promise<string | null> {
  try {
    const appId = Deno.env.get('FULFILLMENT_APP_ID');
    const appSecret = Deno.env.get('FULFILLMENT_APP_SECRET');

    if (!appId || !appSecret) {
      console.log('Fulfillment credentials not configured, skipping');
      return null;
    }

    const fulfillmentPayload = {
      customerName: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      address: order.shipping_address,
      city: order.shipping_city,
      country: order.shipping_country || 'BG',
      items: Array.isArray(order.items) ? order.items.map((item: any) => ({
        productId: item.productId || item.id,
        title: item.productTitle || item.title,
        quantity: item.quantity,
        weight: item.weight || 30,
      })) : [],
      totalPrice: order.total_amount,
      shippingPrice: order.shipping_price,
      totalWithShipping: order.total_with_shipping,
      currency: order.currency,
      shippingMethod: 'standard',
      orderId: order.id,
    };

    console.log('Sending order to fulfillment:', order.id);

    // Create signature
    const timestamp = Date.now().toString();
    const encoder = new TextEncoder();
    const data = encoder.encode(timestamp + JSON.stringify(fulfillmentPayload));
    const key = encoder.encode(appSecret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // For now, generate mock tracking number since we don't have real API endpoint
    // TODO: Replace with actual fulfillment API call when endpoint is provided
    const mockTrackingNumber = `TRK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    console.log('Generated tracking number:', mockTrackingNumber);

    // Update order with tracking number
    const { error: updateError } = await supabase
      .from('orders')
      .update({ tracking_number: mockTrackingNumber })
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update order with tracking:', updateError);
    }

    return mockTrackingNumber;
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
        customer_phone: customer?.phone,
        shipping_address: customer?.address,
        shipping_city: customer?.city,
        shipping_country: customer?.shippingCountry,
        shipping_price: customer?.shippingPrice || 0,
        total_with_shipping: customer?.totalWithShipping || totalAmount,
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
