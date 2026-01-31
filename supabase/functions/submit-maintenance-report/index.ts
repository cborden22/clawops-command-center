import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
