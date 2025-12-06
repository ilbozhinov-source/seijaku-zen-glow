import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const NEXTLEVEL_API_BASE = 'https://api.nextlevel.delivery/v1/fulfillment';

async function sendToFulfillment(order: any, supabase: any): Promise<string | null> {
  try {
    const apiKey = Deno.env.get('FULFILLMENT_APP_ID');

    if (!apiKey) {
      console.log('Fulfillment API key not configured, skipping');
      return null;
    }

    console.log('Sending order to NextLevel fulfillment:', order.id);

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
      cod_amount: order.payment_method === 'cod' ? order.total_with_shipping : 0,
      currency: order.currency,
      comment: `Поръчка от gomatcha.bg - ${order.id}`,
    };

    console.log('NextLevel payload:', JSON.stringify(payload, null, 2));
    console.log('Using API key:', apiKey);

    // Try different authentication methods
    const response = await fetch(`${NEXTLEVEL_API_BASE}/offers`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
