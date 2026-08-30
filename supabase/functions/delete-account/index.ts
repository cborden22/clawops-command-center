import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

// Tables owned directly by a user, deleted in dependency-safe order.
const USER_TABLES = [
  "collection_photos",
  "machine_collections",
  "nayax_transactions",
  "commission_summaries_placeholder", // handled via locations cascade
  "stock_run_history",
  "inventory_balances",
  "inventory_items",
  "inventory_locations",
  "warehouse_zones_placeholder", // handled via warehouses cascade
  "warehouses",
  "lead_activities",
  "leads",
  "mileage_entries",
  "mileage_routes",
  "route_runs",
  "vehicles",
  "revenue_entries",
  "recurring_revenue",
  "expense_budgets",
  "calendar_tasks",
  "custom_categories",
  "custom_machine_types",
  "reminder_dismissals",
  "reminder_preferences",
  "user_schedules",
  "user_preferences",
  "nayax_settings",
  "maintenance_reports",
  "locations",
  "team_members",
  "complimentary_access",
  "user_feedback",
  "profiles",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Please sign in first." }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) {
      return jsonResponse({ error: "Your session has expired. Please sign in again." }, 401);
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== "DELETE") {
      return jsonResponse({ error: "Confirmation text did not match." }, 400);
    }

    console.log(`[DELETE-ACCOUNT] Starting deletion for ${userId}`);

    for (const table of USER_TABLES) {
      if (table.endsWith("_placeholder")) continue;
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error) {
        console.error(`[DELETE-ACCOUNT] ${table}: ${error.message}`);
      }
    }

    // Team memberships where this user was an invited member
    await admin.from("team_members").delete().eq("member_user_id", userId);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error(`[DELETE-ACCOUNT] auth delete failed: ${deleteError.message}`);
      return jsonResponse(
        { error: "We removed your data but could not remove the login. Contact support." },
        500
      );
    }

    console.log(`[DELETE-ACCOUNT] Completed for ${userId}`);
    return jsonResponse({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[DELETE-ACCOUNT] ${message}`);
    return jsonResponse({ error: message }, 500);
  }
});
