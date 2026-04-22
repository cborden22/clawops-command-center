import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_BY_BILLING = {
  monthly: "price_1Sz2PXBarnpPSLEkARaviN8t",
  annual: "price_1Sz2QkBarnpPSLEkmNjK14sW",
} as const;

type BillingInterval = keyof typeof PRICE_BY_BILLING;

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CREATE-CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    logStep("Stripe key verified", { mode: stripeKey.startsWith("sk_live_") ? "live" : "test" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Please sign in before starting checkout." }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) throw new Error(`Authentication failed: ${authError.message}`);
    const user = data.user;
    if (!user?.email) return jsonResponse({ error: "Please sign in before starting checkout." }, 401);

    const body = await req.json().catch(() => ({}));
    const billing = (body.billing ?? "monthly") as BillingInterval;
    const trial = body.trial !== false;
    if (!(billing in PRICE_BY_BILLING)) {
      return jsonResponse({ error: "Please choose monthly or annual billing." }, 400);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const priceId = PRICE_BY_BILLING[billing];
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active) throw new Error(`Configured Stripe price is inactive: ${priceId}`);

    const customers = await stripe.customers.list({ email: user.email, limit: 10 });
    const existingCustomer = customers.data.find((customer) => customer.metadata?.user_id === user.id) ?? customers.data[0];
    const customer = existingCustomer
      ? await stripe.customers.update(existingCustomer.id, {
          email: user.email,
          metadata: { ...existingCustomer.metadata, user_id: user.id, source: "clawops" },
        })
      : await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id, source: "clawops" },
        });

    const origin = req.headers.get("origin") || Deno.env.get("APP_BASE_URL") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      payment_method_collection: trial ? "always" : "if_required",
      success_url: `${origin}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/settings?checkout=cancel`,
      metadata: { user_id: user.id, email: user.email, source: "clawops", billing },
      subscription_data: {
        ...(trial ? { trial_period_days: 7 } : {}),
        metadata: { user_id: user.id, email: user.email, source: "clawops", billing },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, userId: user.id, billing, trial });
    return jsonResponse({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return jsonResponse({ error: "Checkout could not be started. Please try again or contact support." }, 500);
  }
});
