import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewNotificationRequest {
  name: string;
  email: string;
  occupation?: string;
  rating: number;
  text: string;
}

// HTML escape to prevent injection
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendWithResend(
  apiKey: string,
  from: string,
  to: string[],
  subject: string,
  html: string
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to send email");
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, occupation, rating, text }: ReviewNotificationRequest = await req.json();

    console.log("Received new review notification request from:", email);

    // Validate required fields
    if (!name || !email || !text || !rating) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Escape user input
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeOccupation = occupation ? escapeHtml(occupation) : "";
    const safeText = escapeHtml(text);

    // Generate star rating HTML
    const starsHtml = Array.from({ length: 5 }, (_, i) => 
      i < rating 
        ? '<span style="color: #f59e0b;">★</span>' 
        : '<span style="color: #d1d5db;">★</span>'
    ).join("");

    // Send notification email to business
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #1f2937; font-size: 24px; margin: 0;">Нов отзив за одобрение</h1>
              <p style="color: #6b7280; margin-top: 8px;">SEIJAKU Matcha</p>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #92400e; font-weight: 600;">⏳ Изчакващ одобрение</p>
            </div>
            
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Име:</p>
              <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">${safeName}</p>
              ${safeOccupation ? `<p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${safeOccupation}</p>` : ""}
            </div>
            
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Email:</p>
              <p style="margin: 0; color: #1f2937; font-size: 16px;">${safeEmail}</p>
            </div>
            
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Оценка:</p>
              <p style="margin: 0; font-size: 24px;">${starsHtml}</p>
            </div>
            
            <div style="margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Отзив:</p>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6; font-style: italic;">"${safeText}"</p>
              </div>
            </div>
            
            <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <a href="https://gomatcha.bg/admin" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">Към админ панела</a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} SEIJAKU Matcha. Всички права запазени.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending notification email to admin...");
    
    try {
      await sendWithResend(
        resendApiKey,
        "SEIJAKU Matcha <info@gomatcha.bg>",
        ["info@gomatcha.bg"],
        `Нов отзив от ${safeName} - ${rating}/5 звезди`,
        adminEmailHtml
      );
      console.log("Admin notification email sent successfully");
    } catch (error) {
      console.error("Error sending admin notification:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-review-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
