import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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
      country: 'Bulgaria',
      items: Array.isArray(order.items) ? order.items.map((item: any) => ({
        productId: item.productId || item.id,
        title: item.productTitle || item.title,
        quantity: item.quantity,
        weight: item.weight || 30,
      })) : [],
      totalPrice: order.total_amount,
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
