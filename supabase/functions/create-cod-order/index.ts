import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Failed to create order');
    }

    console.log('COD Order created:', order.id);

    return new Response(JSON.stringify({ 
      orderId: order.id,
      status: 'cod_pending'
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
