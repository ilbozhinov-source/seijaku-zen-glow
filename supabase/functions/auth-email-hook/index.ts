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
      language?: string;
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

// Multilingual email content
const translations = {
  bg: {
    recovery: {
      subject: "Възстановяване на парола - SEIJAKU Matcha",
      title: "Възстановяване на парола",
      message: "Получихме заявка за смяна на паролата на вашия акаунт. Кликнете на бутона по-долу, за да зададете нова парола.",
      button: "Смяна на паролата",
      ignore: "Ако не сте заявили смяна на паролата, можете да игнорирате този имейл.",
      linkInfo: "Линкът е валиден за 24 часа. Ако бутонът не работи, копирайте следния URL във вашия браузър:",
      footer: "Всички права запазени.",
    },
    signup: {
      subject: "Потвърдете вашия имейл - SEIJAKU Matcha",
      title: "Добре дошли!",
      message: "Благодарим ви, че се регистрирахте в SEIJAKU Matcha. Моля, потвърдете вашия имейл адрес.",
      button: "Потвърди имейл",
      footer: "Всички права запазени.",
    },
  },
  en: {
    recovery: {
      subject: "Password Recovery - SEIJAKU Matcha",
      title: "Password Recovery",
      message: "We received a request to reset your account password. Click the button below to set a new password.",
      button: "Reset Password",
      ignore: "If you did not request a password reset, you can safely ignore this email.",
      linkInfo: "This link is valid for 24 hours. If the button doesn't work, copy and paste the following URL into your browser:",
      footer: "All rights reserved.",
    },
    signup: {
      subject: "Confirm Your Email - SEIJAKU Matcha",
      title: "Welcome!",
      message: "Thank you for signing up with SEIJAKU Matcha. Please confirm your email address.",
      button: "Confirm Email",
      footer: "All rights reserved.",
    },
  },
  el: {
    recovery: {
      subject: "Ανάκτηση Κωδικού - SEIJAKU Matcha",
      title: "Ανάκτηση Κωδικού",
      message: "Λάβαμε αίτημα για επαναφορά του κωδικού πρόσβασης του λογαριασμού σας. Κάντε κλικ στο παρακάτω κουμπί για να ορίσετε νέο κωδικό.",
      button: "Αλλαγή Κωδικού",
      ignore: "Εάν δεν ζητήσατε επαναφορά κωδικού, μπορείτε να αγνοήσετε αυτό το email.",
      linkInfo: "Αυτός ο σύνδεσμος ισχύει για 24 ώρες. Εάν το κουμπί δεν λειτουργεί, αντιγράψτε την ακόλουθη διεύθυνση URL στο πρόγραμμα περιήγησής σας:",
      footer: "Με επιφύλαξη παντός δικαιώματος.",
    },
    signup: {
      subject: "Επιβεβαιώστε το Email σας - SEIJAKU Matcha",
      title: "Καλώς ήρθατε!",
      message: "Σας ευχαριστούμε που εγγραφήκατε στο SEIJAKU Matcha. Παρακαλούμε επιβεβαιώστε τη διεύθυνση email σας.",
      button: "Επιβεβαίωση Email",
      footer: "Με επιφύλαξη παντός δικαιώματος.",
    },
  },
  ro: {
    recovery: {
      subject: "Recuperare Parola - SEIJAKU Matcha",
      title: "Recuperare Parola",
      message: "Am primit o solicitare de resetare a parolei contului dvs. Faceți clic pe butonul de mai jos pentru a seta o parolă nouă.",
      button: "Resetare Parola",
      ignore: "Dacă nu ați solicitat resetarea parolei, puteți ignora acest email.",
      linkInfo: "Acest link este valabil 24 de ore. Dacă butonul nu funcționează, copiați următoarea adresă URL în browser:",
      footer: "Toate drepturile rezervate.",
    },
    signup: {
      subject: "Confirmați Email-ul - SEIJAKU Matcha",
      title: "Bine ați venit!",
      message: "Vă mulțumim că v-ați înregistrat la SEIJAKU Matcha. Vă rugăm să confirmați adresa de email.",
      button: "Confirmare Email",
      footer: "Toate drepturile rezervate.",
    },
  },
};

type Language = keyof typeof translations;

function getLanguageFromRedirect(redirectTo: string): Language {
  // Extract language from redirect URL query params or path
  try {
    const url = new URL(redirectTo);
    const langParam = url.searchParams.get('lang');
    if (langParam && langParam in translations) {
      return langParam as Language;
    }
    // Check path for language indicator
    const pathParts = url.pathname.split('/');
    for (const part of pathParts) {
      if (part in translations) {
        return part as Language;
      }
    }
  } catch {
    // Invalid URL, use default
  }
  return 'bg'; // Default to Bulgarian
}

function buildEmailHtml(
  lang: Language,
  type: 'recovery' | 'signup',
  actionUrl: string
): string {
  const t = translations[lang][type];
  const recoveryT = translations[lang].recovery;
  
  return `
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
                  <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #2d3436;">${t.title}</h2>
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #636e72;">
                    ${t.message}
                  </p>
                  
                  <!-- Button -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4a7c59; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                          ${t.button}
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  ${type === 'recovery' ? `
                  <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #636e72;">
                    ${recoveryT.ignore}
                  </p>
                  
                  <p style="margin: 20px 0 0; font-size: 12px; line-height: 1.6; color: #b2bec3;">
                    ${recoveryT.linkInfo}
                  </p>
                  <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.6; color: #4a7c59; word-break: break-all;">
                    ${actionUrl}
                  </p>
                  ` : ''}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #e8e8e0; background-color: #f9f9f6; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; font-size: 12px; color: #b2bec3;">
                    © ${new Date().getFullYear()} SEIJAKU Matcha. ${t.footer}
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
    const { email_action_type, token_hash, redirect_to, site_url } = email_data;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Determine language from user metadata or redirect URL
    let lang: Language = 'bg';
    if (user.user_metadata?.language && user.user_metadata.language in translations) {
      lang = user.user_metadata.language as Language;
    } else {
      lang = getLanguageFromRedirect(redirect_to || '');
    }

    console.log("Detected language:", lang);

    let subject = "";
    let htmlContent = "";

    if (email_action_type === "recovery" || email_action_type === "reset") {
      const baseUrl = "https://gomatcha.bg/reset-password";
      const resetUrl = `${baseUrl}?token=${token_hash}&type=recovery&lang=${lang}`;
      
      console.log("Reset URL:", resetUrl);
      
      subject = translations[lang].recovery.subject;
      htmlContent = buildEmailHtml(lang, 'recovery', resetUrl);
    } else if (email_action_type === "signup" || email_action_type === "confirmation") {
      const confirmUrl = `${site_url}/auth/v1/verify?token=${token_hash}&type=signup&redirect_to=${encodeURIComponent(redirect_to || "https://gomatcha.bg")}`;
      
      subject = translations[lang].signup.subject;
      htmlContent = buildEmailHtml(lang, 'signup', confirmUrl);
    } else {
      console.log("Unknown email action type:", email_action_type);
      return new Response(JSON.stringify({ error: "Unknown email action type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Sending email via Resend to:", user.email, "in language:", lang);

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
