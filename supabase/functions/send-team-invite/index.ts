import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteRequest {
  email: string;
  role?: string;
  inviter_name?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resend = new Resend(resendApiKey);
    const { email, role, inviter_name }: InviteRequest = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const roleLabel = role === "manager" ? "Manager" : "Technician";
    const inviterDisplay = inviter_name || "A ClawOps user";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; color: #000; font-size: 28px;">🎉 You're Invited!</h1>
          <p style="margin: 12px 0 0 0; color: #000; font-size: 16px;">Join the team on ClawOps</p>
        </div>
        
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">
            <strong>${inviterDisplay}</strong> has invited you to join their team as a <strong>${roleLabel}</strong>.
          </p>

          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #374151;">What you can do:</h2>
            <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
              <li>View and manage maintenance reports</li>
              <li>Track inventory and locations</li>
              <li>Collaborate with your team in real-time</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="https://clawops-command-center.lovable.app/auth" 
               style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>

          <p style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 24px;">
            Create an account or sign in with <strong>${email}</strong> to get started.
          </p>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          This invitation was sent by ClawOps. If you didn't expect this email, you can safely ignore it.
        </p>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "ClawOps <noreply@clawops.com>",
      to: [email],
      subject: `${inviterDisplay} invited you to join their team on ClawOps`,
      html: emailHtml,
    });

    console.log("Team invite email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send invitation email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
