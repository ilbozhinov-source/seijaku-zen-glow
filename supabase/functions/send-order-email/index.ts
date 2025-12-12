import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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
  };
  paymentMethod: string;
  items: OrderItem[];
  total: number;
  currency: string;
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

    const { customer, shipping, paymentMethod, items, total, currency } = orderData;

    console.log('Customer email:', customer?.email);
    console.log('Customer name:', customer?.firstName, customer?.lastName);
    console.log('Items count:', items?.length);
    console.log('Total:', total, currency);
    console.log('Payment method:', paymentMethod);

    if (!customer?.email || !customer?.firstName || !items?.length) {
      console.error('VALIDATION ERROR: Missing required fields');
      console.error('- Email present:', !!customer?.email);
      console.error('- FirstName present:', !!customer?.firstName);
      console.error('- Items present:', !!items?.length);
      return new Response(
        JSON.stringify({ error: "Missing required order information" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    console.log('=== SMTP CONFIGURATION ===');
    console.log('SMTP_HOST:', smtpHost);
    console.log('SMTP_PORT:', smtpPort);
    console.log('SMTP_USER:', smtpUser);
    console.log('SMTP_PASSWORD configured:', !!smtpPassword);

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.error('SMTP CONFIGURATION ERROR: Missing credentials');
      console.error('- SMTP_HOST:', !!smtpHost);
      console.error('- SMTP_USER:', !!smtpUser);
      console.error('- SMTP_PASSWORD:', !!smtpPassword);
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    const paymentMethodText = paymentMethod === 'cod' ? 'Наложен платеж' : 'Плащане с карта';
    const orderDate = new Date().toLocaleDateString('bg-BG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.title}${item.variant ? ` (${item.variant})` : ''}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${Math.round(item.price * item.quantity)} лв.</td>
      </tr>
    `).join('');

    const itemsText = items.map(item => 
      `- ${item.title}${item.variant ? ` (${item.variant})` : ''} x${item.quantity} - ${Math.round(item.price * item.quantity)} лв.`
    ).join('\n');

    // Email to business
    const businessEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Нова поръчка</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🍵 Нова поръчка!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${orderDate}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #4a7c59; border-bottom: 2px solid #4a7c59; padding-bottom: 10px;">Клиент</h2>
          <p><strong>Име:</strong> ${customer.firstName} ${customer.lastName}</p>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Телефон:</strong> ${customer.phone}</p>
          
          <h2 style="color: #4a7c59; border-bottom: 2px solid #4a7c59; padding-bottom: 10px; margin-top: 30px;">Доставка</h2>
          <p><strong>Адрес:</strong> ${shipping.address}</p>
          <p><strong>Град:</strong> ${shipping.city}</p>
          <p><strong>Пощенски код:</strong> ${shipping.postalCode}</p>
          
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
            <p style="margin: 0; font-size: 18px;"><strong>Обща сума: ${Math.round(total)} лв.</strong></p>
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
        <title>Потвърждение на поръчка</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🍵 SEIJAKU</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Благодарим за поръчката!</p>
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
            <p style="margin: 0; font-size: 18px;"><strong>Обща сума: ${Math.round(total)} лв.</strong></p>
            <p style="margin: 10px 0 0 0;"><strong>Метод на плащане:</strong> ${paymentMethodText}</p>
          </div>
          
          <h2 style="color: #4a7c59; border-bottom: 2px solid #4a7c59; padding-bottom: 10px; margin-top: 30px;">Адрес за доставка</h2>
          <p>${shipping.address}<br>${shipping.city}, ${shipping.postalCode}</p>
          
          <p style="margin-top: 30px; color: #666;">Ще се свържем с теб, когато поръчката е изпратена.</p>
          
          <p style="margin-top: 20px;">С уважение,<br><strong>Екипът на SEIJAKU</strong></p>
        </div>
      </body>
      </html>
    `;

    // Use info@gomatcha.bg as the from address
    const fromEmail = "info@gomatcha.bg";

    console.log('=== SENDING BUSINESS EMAIL ===');
    console.log('From:', fromEmail);
    console.log('To: info@gomatcha.bg');

    // Send email to business
    try {
      await client.send({
        from: fromEmail,
        to: "info@gomatcha.bg",
        subject: `Nova poruchka ot ${customer.firstName} ${customer.lastName} - ${Math.round(total)} lv.`,
        content: `Nova poruchka ot ${customer.firstName} ${customer.lastName}\n\nKontakt:\nEmail: ${customer.email}\nTelefon: ${customer.phone}\n\nAdres:\n${shipping.address}\n${shipping.city}, ${shipping.postalCode}\n\nProdukti:\n${itemsText}\n\nObshta suma: ${Math.round(total)} lv.\nMetod na plashtane: ${paymentMethodText}`,
        html: businessEmailHtml,
      });
      console.log("SUCCESS: Business email sent to info@gomatcha.bg");
    } catch (businessEmailError: any) {
      console.error("ERROR: Failed to send business email:", businessEmailError.message);
      throw businessEmailError;
    }

    console.log('=== SENDING CUSTOMER EMAIL ===');
    console.log('From:', fromEmail);
    console.log('To:', customer.email);

    // Send confirmation email to customer
    try {
      await client.send({
        from: fromEmail,
        to: customer.email,
        subject: "Potvarzhdenie na poruchka - SEIJAKU",
        content: `Zdravey, ${customer.firstName}!\n\nBlagodarim za poruchkata!\n\nProdukti:\n${itemsText}\n\nObshta suma: ${Math.round(total)} lv.\nMetod na plashtane: ${paymentMethodText}\n\nAdres za dostavka:\n${shipping.address}\n${shipping.city}, ${shipping.postalCode}\n\nShte se svarjem s teb, kogato poruchkata e izpratena.\n\nS uvajenie,\nEkipat na SEIJAKU`,
        html: customerEmailHtml,
      });
      console.log("SUCCESS: Customer email sent to", customer.email);
    } catch (customerEmailError: any) {
      console.error("ERROR: Failed to send customer email:", customerEmailError.message);
      throw customerEmailError;
    }

    await client.close();
    console.log('SMTP connection closed');

    console.log('=======================================================');
    console.log('=== SEND-ORDER-EMAIL COMPLETED SUCCESSFULLY ===');
    console.log('=======================================================');

    return new Response(
      JSON.stringify({ success: true, message: "Order received and emails sent" }),
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
