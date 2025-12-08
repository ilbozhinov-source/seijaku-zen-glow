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

    // Determine country and currency
    const country = order.shipping_country || 'BG';
    let currency = 'BGN';
    if (country === 'GR') currency = 'EUR';
    if (country === 'RO') currency = 'RON';

    // Determine courier based on country and shipping method
    let courier = 'Econt';
    if (country === 'GR') courier = 'SpeedX';
    else if (country === 'RO') courier = 'FAN';
    else if (order.courier_name) courier = order.courier_name;
    else if (order.shipping_method?.includes('sameday')) courier = 'Sameday';

    // Calculate products subtotal (price without shipping)
    const items = Array.isArray(order.items) ? order.items : [];
    let productsTotal = 0;
    const products = items.map((item: any, index: number) => {
      const unitPrice = parseFloat(item.price?.amount || item.price || '0');
      const quantity = item.quantity || 1;
      productsTotal += unitPrice * quantity;
      return {
        sku: item.sku || item.variantId || `SKU-${index + 1}`,
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

    // Build payload according to NextLevel API structure
    const payload = {
      order_id: order.id,
      cod: 0, // Card payment - already paid, no COD
      price: productsTotal,
      currency: currency,
      shipping_price: order.shipping_price ? order.shipping_price.toFixed(2) : "0.00",
      ref: order.id,
      courier: courier,
      discount_type: null,
      discount_value: null,
      is_paid: 1, // Card payment is already paid
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

    console.log('=== NextLevel ORDER REQUEST (Stripe) ===');
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
  console.log('=== STRIPE WEBHOOK CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing webhook request...');
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    console.log('Stripe secret key configured:', !!stripeSecretKey);
    console.log('Webhook secret configured:', !!webhookSecret);
    
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    console.log('Signature present:', !!signature);
    console.log('Body length:', body.length);

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        console.log('Webhook signature verified successfully');
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
