import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Check complimentary access first
    const { data: compAccess } = await supabaseClient
      .from("complimentary_access")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (compAccess) {
      const isExpired = compAccess.expires_at && new Date(compAccess.expires_at) < new Date();
      if (!isExpired) {
        return new Response(
          JSON.stringify({
            subscribed: true,
            is_complimentary: true,
            product_id: null,
            subscription_end: compAccess.expires_at,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if user is a team member and inherit owner's subscription
    const { data: membership } = await supabaseClient
      .from("team_members")
      .select("owner_user_id")
      .eq("member_user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membership) {
      // Check owner's complimentary access
      const { data: ownerCompAccess } = await supabaseClient
        .from("complimentary_access")
        .select("*")
        .eq("user_id", membership.owner_user_id)
        .maybeSingle();

      if (ownerCompAccess) {
        const isExpired = ownerCompAccess.expires_at && new Date(ownerCompAccess.expires_at) < new Date();
        if (!isExpired) {
          return new Response(
            JSON.stringify({
              subscribed: true,
              is_complimentary: true,
              is_team_member: true,
              product_id: null,
              subscription_end: ownerCompAccess.expires_at,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
      }

      // Get owner's email from profiles
      const { data: ownerProfile } = await supabaseClient
        .from("profiles")
        .select("email")
        .eq("user_id", membership.owner_user_id)
        .maybeSingle();

      const ownerEmail = ownerProfile?.email;
      if (ownerEmail) {
        const customers = await stripe.customers.list({ email: ownerEmail, limit: 1 });
        if (customers.data.length > 0) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: "active",
            limit: 1,
          });
          if (subscriptions.data.length > 0) {
            const sub = subscriptions.data[0];
            return new Response(
              JSON.stringify({
                subscribed: true,
                is_complimentary: false,
                is_team_member: true,
                product_id: sub.items.data[0].price.product,
                subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
          }
        }
      }

      // Owner has no subscription
      return new Response(JSON.stringify({ subscribed: false, is_team_member: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Not a team member — check own Stripe subscription
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const sub = subscriptions.data[0];
    return new Response(
      JSON.stringify({
        subscribed: true,
        is_complimentary: false,
        product_id: sub.items.data[0].price.product,
        subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
