import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailHookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AuthEmailHookPayload = await req.json();
    
    console.log("=== AUTH EMAIL HOOK START ===");
    console.log("Email action type:", payload.email_data?.email_action_type);
    console.log("User email:", payload.user?.email);
    console.log("Redirect to:", payload.email_data?.redirect_to);

    const { user, email_data } = payload;
    const { email_action_type, token_hash, redirect_to } = email_data;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Build the reset URL with the token
    const baseUrl = redirect_to || "https://gomatcha.bg/reset-password";
    const resetUrl = `${baseUrl}?token=${token_hash}&type=recovery`;

    console.log("Reset URL:", resetUrl);

    let subject = "";
    let htmlContent = "";

    if (email_action_type === "recovery" || email_action_type === "reset") {
      subject = "Възстановяване на парола - SEIJAKU Matcha";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e8e8e0;">
                      <div style="font-size: 48px; color: #4a7c59; margin-bottom: 8px;">静寂</div>
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #2d3436;">SEIJAKU Matcha</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #2d3436;">Възстановяване на парола</h2>
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #636e72;">
                        Получихме заявка за смяна на паролата на вашия акаунт. Кликнете на бутона по-долу, за да зададете нова парола.
                      </p>
                      
                      <!-- Button -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4a7c59; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                              Смяна на паролата
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #636e72;">
                        Ако не сте заявили смяна на паролата, можете да игнорирате този имейл.
                      </p>
                      
                      <p style="margin: 20px 0 0; font-size: 12px; line-height: 1.6; color: #b2bec3;">
                        Линкът е валиден за 24 часа. Ако бутонът не работи, копирайте следния URL във вашия браузър:
                      </p>
                      <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.6; color: #4a7c59; word-break: break-all;">
                        ${resetUrl}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #e8e8e0; background-color: #f9f9f6; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0; font-size: 12px; color: #b2bec3;">
                        © ${new Date().getFullYear()} SEIJAKU Matcha. Всички права запазени.
                      </p>
                      <p style="margin: 8px 0 0; font-size: 12px; color: #b2bec3;">
                        <a href="https://gomatcha.bg" style="color: #4a7c59; text-decoration: none;">gomatcha.bg</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    } else if (email_action_type === "signup" || email_action_type === "confirmation") {
      subject = "Потвърдете вашия имейл - SEIJAKU Matcha";
      const confirmUrl = `${email_data.site_url}/auth/v1/verify?token=${token_hash}&type=signup&redirect_to=${encodeURIComponent(redirect_to || "https://gomatcha.bg")}`;
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e8e8e0;">
                      <div style="font-size: 48px; color: #4a7c59; margin-bottom: 8px;">静寂</div>
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #2d3436;">SEIJAKU Matcha</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #2d3436;">Добре дошли!</h2>
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #636e72;">
                        Благодарим ви, че се регистрирахте в SEIJAKU Matcha. Моля, потвърдете вашия имейл адрес.
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${confirmUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4a7c59; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                              Потвърди имейл
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #e8e8e0; background-color: #f9f9f6; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0; font-size: 12px; color: #b2bec3;">
                        © ${new Date().getFullYear()} SEIJAKU Matcha. Всички права запазени.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    } else {
      console.log("Unknown email action type:", email_action_type);
      return new Response(JSON.stringify({ error: "Unknown email action type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Sending email via Resend to:", user.email);

    const emailResponse = await sendWithResend(
      resendApiKey,
      "SEIJAKU Matcha <info@gomatcha.bg>",
      [user.email],
      subject,
      htmlContent
    );

    console.log("Resend response:", JSON.stringify(emailResponse));
    console.log("=== AUTH EMAIL HOOK SUCCESS ===");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("=== AUTH EMAIL HOOK ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
