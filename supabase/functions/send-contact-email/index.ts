import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// HTML escape function to prevent injection
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Send email using Resend API
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message }: ContactEmailRequest = await req.json();

    console.log("Received contact form submission from:", email);

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Escape user inputs for HTML
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = phone ? escapeHtml(phone) : "Не е посочен";
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

    // Send email to the business
    console.log("Sending email to business...");
    const businessEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4a7c59, #6b9b7a); color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #4a7c59; }
    .message { background: white; padding: 15px; border-left: 4px solid #4a7c59; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ново запитване от SEIJAKU</h1>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">Име:</span> ${safeName}
      </div>
      <div class="field">
        <span class="label">Имейл:</span> <a href="mailto:${safeEmail}">${safeEmail}</a>
      </div>
      <div class="field">
        <span class="label">Телефон:</span> ${safePhone}
      </div>
      <div class="message">
        <span class="label">Съобщение:</span>
        <p>${safeMessage}</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await sendWithResend(
      resendApiKey,
      'SEIJAKU Matcha <info@gomatcha.bg>',
      ['info@gomatcha.bg'],
      `Ново запитване от ${safeName}`,
      businessEmailHtml
    );
    console.log("Business email sent successfully");

    // Send confirmation to the customer
    console.log("Sending confirmation to customer:", email);
    const customerEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4a7c59, #6b9b7a); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SEIJAKU 静寂</h1>
    </div>
    <div class="content">
      <p>Здравейте ${safeName},</p>
      <p>Благодарим ви, че се свързахте с нас!</p>
      <p>Получихме вашето съобщение и ще ви отговорим възможно най-скоро.</p>
      <p>С уважение,<br><strong>Екипът на SEIJAKU</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 SEIJAKU. Всички права запазени.</p>
    </div>
  </div>
</body>
</html>
    `;

    await sendWithResend(
      resendApiKey,
      'SEIJAKU Matcha <info@gomatcha.bg>',
      [email],
      'Получихме вашето запитване - SEIJAKU',
      customerEmailHtml
    );
    console.log("Customer confirmation email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);