import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const emptyStatus = (extra: Record<string, unknown> = {}) => ({
  subscribed: false,
  is_complimentary: false,
  is_team_member: false,
  product_id: null,
  subscription_status: null,
  subscription_end: null,
  trial_active: false,
  trial_end: null,
  ...extra,
});

const statusFromSubscription = (subscription: Stripe.Subscription, extra: Record<string, unknown> = {}) => ({
  subscribed: ACTIVE_STATUSES.has(subscription.status),
  is_complimentary: false,
  is_team_member: false,
  product_id: subscription.items.data[0]?.price.product ?? null,
  subscription_status: subscription.status,
  subscription_end: subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null,
  trial_active: subscription.status === "trialing",
  trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  ...extra,
});

async function getUserCreatedAt(supabaseClient: ReturnType<typeof createClient>, userId: string, fallback: string | null) {
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("created_at")
    .eq("user_id", userId)
    .maybeSingle();

  return profile?.created_at ?? fallback;
}

async function getValidComplimentaryAccess(supabaseClient: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabaseClient
    .from("complimentary_access")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
  return isExpired ? null : data;
}

async function findStripeCustomer(stripe: Stripe, email: string, userId: string) {
  const byMetadata = await stripe.customers.search({
    query: `metadata['user_id']:'${userId}'`,
    limit: 1,
  }).catch(() => null);
  if (byMetadata?.data.length) return byMetadata.data[0];

  const byEmail = await stripe.customers.list({ email, limit: 10 });
  return byEmail.data.find((customer) => customer.metadata?.user_id === userId) ?? byEmail.data[0] ?? null;
}

async function getBestSubscription(stripe: Stripe, customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });

  return (
    subscriptions.data.find((sub) => sub.status === "trialing") ??
    subscriptions.data.find((sub) => sub.status === "active") ??
    subscriptions.data.find((sub) => sub.status === "past_due") ??
    subscriptions.data[0] ??
    null
  );
}

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
    if (!authHeader) return jsonResponse({ error: "No authorization header" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication failed: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) return jsonResponse({ error: "User not authenticated" }, 401);

    const userCreatedAt = await getUserCreatedAt(supabaseClient, user.id, user.created_at ?? null);

    const ownCompAccess = await getValidComplimentaryAccess(supabaseClient, user.id);
    if (ownCompAccess) {
      return jsonResponse({
        ...emptyStatus({
          subscribed: true,
          is_complimentary: true,
          subscription_status: "complimentary",
          subscription_end: ownCompAccess.expires_at,
          user_created_at: userCreatedAt,
        }),
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    logStep("Stripe key verified", { mode: stripeKey.startsWith("sk_live_") ? "live" : "test" });
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { data: membership } = await supabaseClient
      .from("team_members")
      .select("owner_user_id")
      .eq("member_user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    const billingUserId = membership?.owner_user_id ?? user.id;
    let billingEmail = user.email;

    if (membership) {
      const ownerCompAccess = await getValidComplimentaryAccess(supabaseClient, membership.owner_user_id);
      if (ownerCompAccess) {
        return jsonResponse({
          ...emptyStatus({
            subscribed: true,
            is_complimentary: true,
            is_team_member: true,
            subscription_status: "complimentary",
            subscription_end: ownerCompAccess.expires_at,
            user_created_at: userCreatedAt,
          }),
        });
      }

      const { data: ownerProfile } = await supabaseClient
        .from("profiles")
        .select("email")
        .eq("user_id", membership.owner_user_id)
        .maybeSingle();

      billingEmail = ownerProfile?.email ?? user.email;
    }

    const customer = await findStripeCustomer(stripe, billingEmail, billingUserId);
    if (!customer) {
      return jsonResponse(emptyStatus({ is_team_member: !!membership, user_created_at: userCreatedAt }));
    }

    const subscription = await getBestSubscription(stripe, customer.id);
    if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) {
      return jsonResponse(emptyStatus({
        is_team_member: !!membership,
        subscription_status: subscription?.status ?? null,
        user_created_at: userCreatedAt,
      }));
    }

    return jsonResponse(statusFromSubscription(subscription, {
      is_team_member: !!membership,
      user_created_at: userCreatedAt,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return jsonResponse({ error: "Subscription status could not be checked. Please try again." }, 500);
  }
});
