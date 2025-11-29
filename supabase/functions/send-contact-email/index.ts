import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.error("Missing SMTP configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Connecting to SMTP server:", smtpHost, "port:", smtpPort);

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

    const fromEmail = "info@gomatcha.bg";
    
    // Send email to the business
    await client.send({
      from: fromEmail,
      to: "info@gomatcha.bg",
      subject: `Ново запитване от ${name}`,
      content: `
Ново запитване от контактната форма на SEIJAKU:

Име: ${name}
Имейл: ${email}
Телефон: ${phone || "Не е посочен"}

Съобщение:
${message}
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
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
        <span class="label">Име:</span> ${name}
      </div>
      <div class="field">
        <span class="label">Имейл:</span> <a href="mailto:${email}">${email}</a>
      </div>
      <div class="field">
        <span class="label">Телефон:</span> ${phone || "Не е посочен"}
      </div>
      <div class="message">
        <span class="label">Съобщение:</span>
        <p>${message.replace(/\n/g, "<br>")}</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    });

    // Send confirmation to the customer
    await client.send({
      from: fromEmail,
      to: email,
      subject: "Получихме вашето запитване - SEIJAKU",
      content: `
Здравейте ${name},

Благодарим ви, че се свързахте с нас!

Получихме вашето съобщение и ще ви отговорим възможно най-скоро.

С уважение,
Екипът на SEIJAKU
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
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
      <p>Здравейте ${name},</p>
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
      `,
    });

    await client.close();

    console.log("Emails sent successfully");

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
