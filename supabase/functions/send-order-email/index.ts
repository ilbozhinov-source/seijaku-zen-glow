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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderEmailRequest = await req.json();
    console.log("Received order:", JSON.stringify(orderData, null, 2));

    const { customer, shipping, paymentMethod, items, total, currency } = orderData;

    if (!customer?.email || !customer?.firstName || !items?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required order information" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.error("SMTP configuration missing");
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

    // Send email to business
    await client.send({
      from: smtpUser,
      to: "info@gomatcha.bg",
      subject: `🍵 Нова поръчка от ${customer.firstName} ${customer.lastName} - ${Math.round(total)} лв.`,
      content: `Нова поръчка от ${customer.firstName} ${customer.lastName}\n\nКонтакт:\nEmail: ${customer.email}\nТелефон: ${customer.phone}\n\nАдрес:\n${shipping.address}\n${shipping.city}, ${shipping.postalCode}\n\nПродукти:\n${itemsText}\n\nОбща сума: ${Math.round(total)} лв.\nМетод на плащане: ${paymentMethodText}`,
      html: businessEmailHtml,
    });

    console.log("Business email sent successfully");

    // Send confirmation email to customer
    await client.send({
      from: smtpUser,
      to: customer.email,
      subject: "🍵 Потвърждение на поръчка - SEIJAKU",
      content: `Здравей, ${customer.firstName}!\n\nБлагодарим за поръчката!\n\nПродукти:\n${itemsText}\n\nОбща сума: ${Math.round(total)} лв.\nМетод на плащане: ${paymentMethodText}\n\nАдрес за доставка:\n${shipping.address}\n${shipping.city}, ${shipping.postalCode}\n\nЩе се свържем с теб, когато поръчката е изпратена.\n\nС уважение,\nЕкипът на SEIJAKU`,
      html: customerEmailHtml,
    });

    console.log("Customer confirmation email sent successfully");

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: "Order received and emails sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error processing order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
