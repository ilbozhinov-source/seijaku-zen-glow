import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  title: string;
  variant: string;
  quantity: number;
  price: number;
}

interface OrderEmailRequest {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shipping: {
    address: string;
    city: string;
    postalCode: string;
    country?: string;
    shippingMethod?: string;
    officeId?: string;
  };
  paymentMethod: string;
  items: OrderItem[];
  total: number;
  shippingPrice?: number;
  shippingCurrency?: string;
  totalWithShipping?: number;
  currency: string;
  orderNumber?: string;
}

async function sendWithResend(apiKey: string, from: string, to: string[], subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send email');
  }
  return data;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=======================================================');
  console.log('=== SEND-ORDER-EMAIL FUNCTION CALLED ===');
  console.log('=======================================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderEmailRequest = await req.json();
    console.log("Received order data:", JSON.stringify(orderData, null, 2));

    const { customer, shipping, paymentMethod, items, total, currency, orderNumber, shippingPrice, totalWithShipping } = orderData;

    console.log('Customer email:', customer?.email);
    console.log('Customer name:', customer?.firstName, customer?.lastName);
    console.log('Items count:', items?.length);
    console.log('Total:', total, currency);
    console.log('Payment method:', paymentMethod);
    console.log('Order number:', orderNumber);

    if (!customer?.email || !customer?.firstName || !items?.length) {
      console.error('VALIDATION ERROR: Missing required fields');
      return new Response(
        JSON.stringify({ error: "Missing required order information" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('=== RESEND CONFIGURATION ===');
    console.log('RESEND_API_KEY configured:', !!resendApiKey);

    if (!resendApiKey) {
      console.error('ERROR: RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const paymentMethodText = paymentMethod === 'cod' ? 'Наложен платеж' : 'Плащане с карта';
    const orderDate = new Date().toLocaleDateString('bg-BG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const displayTotal = totalWithShipping || total;
    const currencySymbol = currency === 'BGN' ? 'лв.' : currency === 'EUR' ? '€' : currency;

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.title}${item.variant ? ` (${item.variant})` : ''}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.price} ${currencySymbol}</td>
      </tr>
    `).join('');

    const shippingDisplay = shippingPrice ? `${shippingPrice} ${currencySymbol}` : 'Включена';

    // Email to business
    const businessEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Нова поръчка #${orderNumber || 'N/A'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🍵 Нова поръчка!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Поръчка #${orderNumber || 'N/A'}</p>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">${orderDate}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #4a7c59; border-bottom: 2px solid #4a7c59; padding-bottom: 10px;">Клиент</h2>
          <p><strong>Име:</strong> ${customer.firstName} ${customer.lastName}</p>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Телефон:</strong> ${customer.phone}</p>
          
          <h2 style="color: #4a7c59; border-bottom: 2px solid #4a7c59; padding-bottom: 10px; margin-top: 30px;">Доставка</h2>
          <p><strong>Адрес:</strong> ${shipping.address}</p>
          <p><strong>Град:</strong> ${shipping.city}</p>
          ${shipping.postalCode ? `<p><strong>Пощенски код:</strong> ${shipping.postalCode}</p>` : ''}
          ${shipping.shippingMethod ? `<p><strong>Метод:</strong> ${shipping.shippingMethod}</p>` : ''}
          
          <h2 style="color: #4a7c59; border-bottom: 2px solid #4a7c59; padding-bottom: 10px; margin-top: 30px;">Поръчка</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #4a7c59; color: white;">
                <th style="padding: 12px; text-align: left;">Продукт</th>
                <th style="padding: 12px; text-align: center;">Кол.</th>
                <th style="padding: 12px; text-align: right;">Цена</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; padding: 20px; background: #4a7c59; color: white; border-radius: 8px;">
            <p style="margin: 0;"><strong>Продукти:</strong> ${total} ${currencySymbol}</p>
            <p style="margin: 5px 0;"><strong>Доставка:</strong> ${shippingDisplay}</p>
            <p style="margin: 10px 0 0 0; font-size: 18px;"><strong>Обща сума: ${displayTotal} ${currencySymbol}</strong></p>
            <p style="margin: 10px 0 0 0;"><strong>Метод на плащане:</strong> ${paymentMethodText}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email to customer
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Потвърждение на поръчка #${orderNumber || 'N/A'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🍵 SEIJAKU</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Благодарим за поръчката!</p>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Поръчка #${orderNumber || 'N/A'}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Здравей, ${customer.firstName}!</p>
          <p>Получихме твоята поръчка и ще я обработим възможно най-скоро.</p>
          
          <h2 style="color: #4a7c59; border-bottom: 2px solid #4a7c59; padding-bottom: 10px; margin-top: 30px;">Твоята поръчка</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #4a7c59; color: white;">
                <th style="padding: 12px; text-align: left;">Продукт</th>
                <th style="padding: 12px; text-align: center;">Кол.</th>
                <th style="padding: 12px; text-align: right;">Цена</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; padding: 20px; background: #4a7c59; color: white; border-radius: 8px;">
            <p style="margin: 0;"><strong>Продукти:</strong> ${total} ${currencySymbol}</p>
            <p style="margin: 5px 0;"><strong>Доставка:</strong> ${shippingDisplay}</p>
            <p style="margin: 10px 0 0 0; font-size: 18px;"><strong>Обща сума: ${displayTotal} ${currencySymbol}</strong></p>
            <p style="margin: 10px 0 0 0;"><strong>Метод на плащане:</strong> ${paymentMethodText}</p>
          </div>
          
          <h2 style="color: #4a7c59; border-bottom: 2px solid #4a7c59; padding-bottom: 10px; margin-top: 30px;">Адрес за доставка</h2>
          <p>${shipping.address}<br>${shipping.city}${shipping.postalCode ? `, ${shipping.postalCode}` : ''}</p>
          
          <p style="margin-top: 30px; color: #666;">Ще се свържем с теб, когато поръчката е изпратена.</p>
          
          <p style="margin-top: 20px;">С уважение,<br><strong>Екипът на SEIJAKU</strong></p>
        </div>
      </body>
      </html>
    `;

    // Send email to business
    console.log('=== SENDING BUSINESS EMAIL ===');
    console.log('From: info@gomatcha.bg');
    console.log('To: info@gomatcha.bg');

    try {
      const businessResult = await sendWithResend(
        resendApiKey,
        'SEIJAKU <info@gomatcha.bg>',
        ['info@gomatcha.bg'],
        `Нова поръчка #${orderNumber || 'N/A'} от ${customer.firstName} ${customer.lastName}`,
        businessEmailHtml
      );
      console.log("SUCCESS: Business email sent:", JSON.stringify(businessResult));
    } catch (businessEmailError: any) {
      console.error("ERROR: Failed to send business email:", businessEmailError.message);
    }

    // Send confirmation email to customer
    console.log('=== SENDING CUSTOMER EMAIL ===');
    console.log('From: info@gomatcha.bg');
    console.log('To:', customer.email);

    try {
      const customerResult = await sendWithResend(
        resendApiKey,
        'SEIJAKU <info@gomatcha.bg>',
        [customer.email],
        `Потвърждение на поръчка #${orderNumber || 'N/A'} - SEIJAKU`,
        customerEmailHtml
      );
      console.log("SUCCESS: Customer email sent:", JSON.stringify(customerResult));
    } catch (customerEmailError: any) {
      console.error("ERROR: Failed to send customer email:", customerEmailError.message);
    }

    console.log('=======================================================');
    console.log('=== SEND-ORDER-EMAIL COMPLETED SUCCESSFULLY ===');
    console.log('=======================================================');

    return new Response(
      JSON.stringify({ success: true, message: "Order emails sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('=======================================================');
    console.error('=== SEND-ORDER-EMAIL ERROR ===');
    console.error('=======================================================');
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error('=======================================================');
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
