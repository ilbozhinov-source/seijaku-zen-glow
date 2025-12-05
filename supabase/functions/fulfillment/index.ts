import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: { amount: string; currencyCode: string };
}

interface FulfillmentOrder {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
}

async function sendOrderToFulfillment(order: FulfillmentOrder): Promise<{ success: boolean; trackingNumber?: string; error?: string }> {
  const appId = Deno.env.get('FULFILLMENT_APP_ID');
  const appSecret = Deno.env.get('FULFILLMENT_APP_SECRET');

  if (!appId || !appSecret) {
    console.error('Fulfillment credentials not configured');
    return { success: false, error: 'Fulfillment credentials not configured' };
  }

  console.log('Sending order to fulfillment API:', order.orderId);

  // Prepare the payload for the fulfillment API
  const payload = {
    order_id: order.orderId,
    recipient: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.shippingAddress,
      city: order.shippingCity,
    },
    items: order.items.map(item => ({
      name: item.productTitle,
      variant: item.variantTitle,
      quantity: item.quantity,
      price: parseFloat(item.price.amount),
      currency: item.price.currencyCode,
    })),
    total_amount: order.totalAmount,
    currency: order.currency,
  };

  try {
    // Generate timestamp for request signing
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Create signature (example: HMAC-like signing)
    const signatureData = `${appId}:${timestamp}:${JSON.stringify(payload)}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(appSecret);
    const messageData = encoder.encode(signatureData);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // TODO: Replace with actual fulfillment API endpoint
    const fulfillmentApiUrl = 'https://api.fulfillment-provider.com/v1/orders';
    
    console.log('Fulfillment request prepared with signature');
    console.log('Headers: X-App-ID:', appId);
    console.log('Headers: X-Timestamp:', timestamp);
    console.log('Headers: X-Signature:', signatureHex.substring(0, 20) + '...');

    // Uncomment when ready to connect to real API:
    /*
    const response = await fetch(fulfillmentApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': appId,
        'X-Timestamp': timestamp,
        'X-Signature': signatureHex,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fulfillment API error:', response.status, errorText);
      return { success: false, error: `API error: ${response.status}` };
    }

    const result = await response.json();
    console.log('Fulfillment API response:', result);
    
    return { 
      success: true, 
      trackingNumber: result.tracking_number 
    };
    */

    // Mock response for testing
    const mockTrackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    console.log('Mock tracking number generated:', mockTrackingNumber);
    
    return { 
      success: true, 
      trackingNumber: mockTrackingNumber 
    };

  } catch (error: unknown) {
    console.error('Fulfillment API request failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Test endpoint
    if (action === 'test') {
      console.log('Testing fulfillment integration...');
      
      const appId = Deno.env.get('FULFILLMENT_APP_ID');
      const appSecret = Deno.env.get('FULFILLMENT_APP_SECRET');
      
      const testOrder: FulfillmentOrder = {
        orderId: 'TEST-' + Date.now(),
        customerName: 'Тест Клиент',
        customerEmail: 'test@example.com',
        customerPhone: '+359888123456',
        shippingAddress: 'ул. Тестова 1',
        shippingCity: 'София',
        items: [{
          productTitle: 'SEIJAKU Церемониална Матча',
          variantTitle: '30g',
          quantity: 1,
          price: { amount: '28.00', currencyCode: 'BGN' }
        }],
        totalAmount: 28.00,
        currency: 'BGN'
      };

      const result = await sendOrderToFulfillment(testOrder);
      
      return new Response(JSON.stringify({
        test: true,
        credentialsConfigured: !!(appId && appSecret),
        appIdSet: !!appId,
        appSecretSet: !!appSecret,
        result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send order to fulfillment
    if (req.method === 'POST') {
      const { orderId } = await req.json();
      
      if (!orderId) {
        return new Response(JSON.stringify({ error: 'Order ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Processing fulfillment for order:', orderId);

      // Fetch order from database
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Order not found:', orderError);
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const fulfillmentOrder: FulfillmentOrder = {
        orderId: order.id,
        customerName: order.customer_name || '',
        customerEmail: order.customer_email || '',
        customerPhone: order.customer_phone || '',
        shippingAddress: order.shipping_address || '',
        shippingCity: order.shipping_city || '',
        items: order.items as OrderItem[],
        totalAmount: order.total_amount,
        currency: order.currency,
      };

      const result = await sendOrderToFulfillment(fulfillmentOrder);

      if (result.success && result.trackingNumber) {
        // Update order with tracking number (you may need to add this column)
        console.log('Order sent to fulfillment successfully. Tracking:', result.trackingNumber);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Fulfillment function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
