import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

    console.log('Sending Stripe order to NextLevel fulfillment:', order.id);

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
      receiver_name: order.customer_name,
      receiver_phone: order.customer_phone,
      receiver_email: order.customer_email,
      receiver_country: order.shipping_country || 'BG',
      receiver_city: order.shipping_city,
      receiver_address: order.shipping_address,
      receiver_postcode: order.postal_code || '',
      courier_name: courier,
      service: service,
      office_id: order.courier_office_id || null,
      products: items,
      // For Stripe payments, COD amount is 0 (already paid)
      cod_amount: 0,
      currency: order.currency,
      comment: `Поръчка от gomatcha.bg - ${order.id} (Платено с карта)`,
      shipping_price: order.shipping_price || 0,
      total_amount: order.total_with_shipping || order.total_amount,
    };

    console.log('=== NextLevel Fulfillment Request (Stripe) ===');
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
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Webhook signature verification failed:', message);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // For testing without signature verification
      event = JSON.parse(body);
      console.log('Warning: Processing webhook without signature verification');
    }

    console.log('Received Stripe event:', event.type);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Checkout session completed:', session.id);
      console.log('Order ID from metadata:', session.metadata?.order_id);

      let orderId = session.metadata?.order_id;

      // Update order status to paid
      if (orderId) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', orderId);

        if (updateError) {
          console.error('Failed to update order:', updateError);
          throw new Error('Failed to update order status');
        }

        console.log('Order marked as paid:', orderId);
      } else {
        // Try to find by stripe_session_id
        const { data: foundOrder, error: findError } = await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('stripe_session_id', session.id)
          .select()
          .maybeSingle();

        if (findError) {
          console.error('Failed to update order by session ID:', findError);
        } else if (foundOrder) {
          orderId = foundOrder.id;
        }
      }

      // Fetch order data and send to fulfillment
      if (orderId) {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (!orderError && order) {
          await sendToFulfillment(order, supabase);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
