import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, customer, successUrl, cancelUrl } = await req.json();
    
    console.log('Creating Stripe checkout session', { itemsCount: items?.length, customer });

    if (!items || items.length === 0) {
      throw new Error('No items provided');
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate total
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.price.amount) * item.quantity);
    }, 0);

    // Determine currency based on country
    const country = customer?.shippingCountryCode || 'BG';
    let currency = 'BGN';
    if (country === 'GR') currency = 'EUR';
    if (country === 'RO') currency = 'RON';

    // For Sameday easybox, set address from box label
    let shippingAddress = customer?.address;
    let shippingCity = customer?.city;
    let postalCode = customer?.postalCode;
    
    if (customer?.samedayBoxId && customer?.samedayBoxLabel) {
      shippingAddress = customer.samedayBoxLabel;
      shippingCity = '';
      postalCode = '';
    }

    // Create order first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        items: items,
        total_amount: totalAmount,
        currency: currency,
        payment_method: 'card',
        status: 'pending',
        customer_name: customer?.name,
        customer_email: customer?.email,
        customer_phone: customer?.phone, // Full phone with country code
        phone_country_code: customer?.phoneCountryCode || null,
        phone_number: customer?.phoneNumber || null,
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        postal_code: postalCode,
        // Shipping country info
        shipping_country: country,
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

    console.log('Order created:', order.id);

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: item.productTitle || item.product?.title || 'Продукт',
          description: item.variantTitle || undefined,
        },
        unit_amount: Math.round(parseFloat(item.price.amount) * 100), // Convert to smallest unit
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${cancelUrl}?order_id=${order.id}`,
      customer_email: customer?.email,
      metadata: {
        order_id: order.id,
      },
    });

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    console.log('Stripe session created:', session.id);

    return new Response(JSON.stringify({ 
      sessionId: session.id, 
      url: session.url,
      orderId: order.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
