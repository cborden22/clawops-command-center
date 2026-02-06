import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (resets on function cold start, but sufficient for basic protection)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5; // 5 reports per hour per IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count };
}

// Input validation schemas
const VALID_ISSUE_TYPES = ["not_working", "stuck_prize", "coin_jam", "display_issue", "other"];
const VALID_SEVERITIES = ["low", "medium", "high"];

function validateInput(data: unknown): { valid: boolean; error?: string; sanitized?: Record<string, unknown> } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const body = data as Record<string, unknown>;

  // Validate machine_id (UUID format)
  if (typeof body.machine_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.machine_id)) {
    return { valid: false, error: "Invalid machine_id format" };
  }

  // Validate issue_type
  if (!VALID_ISSUE_TYPES.includes(body.issue_type as string)) {
    return { valid: false, error: "Invalid issue_type" };
  }

  // Validate severity
  if (!VALID_SEVERITIES.includes(body.severity as string)) {
    return { valid: false, error: "Invalid severity" };
  }

  // Validate description (required, 10-1000 chars)
  if (typeof body.description !== "string" || body.description.length < 10 || body.description.length > 1000) {
    return { valid: false, error: "Description must be between 10 and 1000 characters" };
  }

  // Validate optional reporter_name (max 100 chars)
  const reporterName = body.reporter_name;
  if (reporterName !== undefined && reporterName !== null && reporterName !== "") {
    if (typeof reporterName !== "string" || reporterName.length > 100) {
      return { valid: false, error: "Reporter name must be under 100 characters" };
    }
  }

  // Validate optional reporter_contact (max 255 chars)
  const reporterContact = body.reporter_contact;
  if (reporterContact !== undefined && reporterContact !== null && reporterContact !== "") {
    if (typeof reporterContact !== "string" || reporterContact.length > 255) {
      return { valid: false, error: "Reporter contact must be under 255 characters" };
    }
  }

  return {
    valid: true,
    sanitized: {
      machine_id: body.machine_id,
      issue_type: body.issue_type,
      severity: body.severity,
      description: body.description.trim(),
      reporter_name: (typeof reporterName === "string" && reporterName.trim()) || null,
      reporter_contact: (typeof reporterContact === "string" && reporterContact.trim()) || null,
    },
  };
}

// Issue type display names
const ISSUE_TYPE_LABELS: Record<string, string> = {
  not_working: "Not Working",
  stuck_prize: "Stuck Prize",
  coin_jam: "Coin Jam",
  display_issue: "Display Issue",
  other: "Other Issue",
};

// Severity display names and colors
const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "#22c55e" },
  medium: { label: "Medium", color: "#f59e0b" },
  high: { label: "High", color: "#ef4444" },
};

// Send email notification to machine owner
async function sendEmailNotification(
  resend: Resend,
  ownerEmail: string,
  machineInfo: { machine_type: string; custom_label: string; location_name: string },
  reportData: Record<string, unknown>
): Promise<void> {
  const issueLabel = ISSUE_TYPE_LABELS[reportData.issue_type as string] || reportData.issue_type;
  const severityInfo = SEVERITY_LABELS[reportData.severity as string] || { label: reportData.severity, color: "#6b7280" };
  
  const machineLabel = machineInfo.custom_label || machineInfo.machine_type;
  const reporterInfo = reportData.reporter_name 
    ? `${reportData.reporter_name}${reportData.reporter_contact ? ` (${reportData.reporter_contact})` : ""}`
    : "Anonymous";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Maintenance Report</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: #000; font-size: 24px;">🔧 Maintenance Report</h1>
      </div>
      
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #374151;">Machine Details</h2>
          <p style="margin: 4px 0; color: #6b7280;">
            <strong>Machine:</strong> ${machineLabel}
          </p>
          <p style="margin: 4px 0; color: #6b7280;">
            <strong>Location:</strong> ${machineInfo.location_name}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #374151;">Issue Information</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Issue Type:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${issueLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Severity:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="background: ${severityInfo.color}20; color: ${severityInfo.color}; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                  ${severityInfo.label}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Reported By:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${reporterInfo}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #92400e;">Description</h3>
          <p style="margin: 0; color: #78350f;">${reportData.description}</p>
        </div>

        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
            View and manage this report in ClawOps
          </p>
          <a href="https://clawops-command-center.lovable.app/maintenance" 
             style="display: inline-block; background: #f59e0b; color: #000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
            Open Maintenance Dashboard
          </a>
        </div>
      </div>

      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
        This is an automated notification from ClawOps
      </p>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "ClawOps <noreply@clawops.com>",
    to: [ownerEmail],
    subject: `🔧 ${severityInfo.label} Priority: ${issueLabel} - ${machineLabel} at ${machineInfo.location_name}`,
    html: emailHtml,
  });
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
    // Get client IP for rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0].trim() || "unknown";

    // Check rate limit
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many reports submitted. Please try again later." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "3600",
          },
        }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validation = validateInput(body);

    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = validation.sanitized!;

    // Create Supabase client with service role for inserting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, get the machine owner using the RPC function
    const { data: ownerData, error: ownerError } = await supabase.rpc("get_machine_owner", {
      machine_uuid: data.machine_id,
    });

    if (ownerError || !ownerData) {
      console.error("Error getting machine owner:", ownerError);
      return new Response(JSON.stringify({ error: "Invalid machine ID or machine not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert the report with the owner's user_id
    const { error: insertError } = await supabase.from("maintenance_reports").insert({
      machine_id: data.machine_id,
      user_id: ownerData,
      reporter_name: data.reporter_name,
      reporter_contact: data.reporter_contact,
      issue_type: data.issue_type,
      description: data.description,
      severity: data.severity,
      status: "open",
    });

    if (insertError) {
      console.error("Error inserting report:", insertError);
      return new Response(JSON.stringify({ error: "Failed to submit report" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to send email notification (don't fail the request if email fails)
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);

        // Get owner's email and notification preference from profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("email, email_notifications_enabled")
          .eq("user_id", ownerData)
          .single();

        // Get machine info for the email
        const { data: machineInfo } = await supabase.rpc("get_machine_public_info", {
          machine_uuid: data.machine_id,
        });

        if (
          profileData?.email &&
          profileData?.email_notifications_enabled !== false &&
          machineInfo?.[0]
        ) {
          await sendEmailNotification(
            resend,
            profileData.email,
            machineInfo[0],
            data
          );
          console.log("Email notification sent to:", profileData.email);
        }
      }
    } catch (emailError) {
      // Log but don't fail the request
      console.error("Failed to send email notification:", emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Report submitted successfully",
        remaining_reports: rateLimit.remaining 
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});