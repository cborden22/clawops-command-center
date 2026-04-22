
## Make the subscription signup flow reliable end-to-end

### Goal

Fix the subscription flow so new users have a simple path:

```text
Sales page
  → Create account
  → Verify email
  → Log in
  → Secure Stripe Checkout with required card
  → Return to ClawOps
  → App confirms trial/subscription
  → User gets Pro access
```

The app will no longer show or rely on the old “3 locations / 1 team member” free plan for new users.

---

## What needs to be fixed

### 1) Stripe Checkout must require a card for the trial

The current checkout function starts a subscription trial, but it does not explicitly enforce the “card required before trial starts” behavior.

I will update `create-checkout` so trial checkout uses Stripe’s subscription-trial setup correctly:

- `mode: "subscription"`
- `subscription_data.trial_period_days: 7`
- `payment_method_collection: "always"`
- proper customer creation/reuse
- user metadata attached to the Stripe customer/session/subscription
- success URL includes the Checkout Session ID:
  ```text
  /settings?checkout=success&session_id={CHECKOUT_SESSION_ID}
  ```

This ensures the user enters payment details during checkout even though they are not charged until the trial ends.

---

### 2) Stop trusting client-supplied Stripe price IDs

Right now the frontend sends a raw `priceId` to the backend. That is fragile and less secure.

I will change the flow so the frontend sends only a safe plan choice:

```ts
{
  billing: "monthly" | "annual",
  trial: true | false
}
```

Then the backend chooses the correct Stripe price ID from a server-side allowlist.

This prevents bad or outdated client values from breaking checkout.

---

### 3) Add Stripe key and price validation inside the backend function

I will harden `create-checkout`, `check-subscription`, and `customer-portal` with clearer validation and logs:

- verify `STRIPE_SECRET_KEY` exists
- log whether the key is test or live by prefix only, never the full secret
- verify the selected price exists in Stripe before creating Checkout
- reject unknown billing values
- return clear user-safe errors to the frontend
- log detailed backend-only errors for debugging

This directly addresses the “it still isn’t working” problem by making the failure visible instead of silently showing a generic checkout failure.

---

### 4) Make account creation and billing feel like one flow

Stripe cannot fully replace ClawOps account creation because the app’s data security depends on authenticated ClawOps users. But the user experience can be made seamless.

I will update the auth and paywall flow so users see one clear process:

```text
Step 1: Create your ClawOps account
Step 2: Verify your email
Step 3: Enter payment details in Stripe to activate the free trial
```

Changes:
- preserve `trial=true` through signup/login
- after login, immediately guide new users into Stripe Checkout
- if auto-checkout fails, show a clear manual “Continue to secure billing” screen
- explain that no charge happens during the 7-day trial
- remove confusing language that makes it sound like account creation alone starts the trial

Files:
- `src/pages/Auth.tsx`
- `src/components/trial/TrialPaywall.tsx`
- `src/App.tsx`

---

### 5) Fix post-checkout status confirmation

After Stripe redirects back to ClawOps, the app should immediately confirm the subscription/trial instead of waiting for the next polling cycle.

I will add a small checkout-return handler on the Settings page or subscription manager:

- detect `checkout=success`
- read `session_id`
- call a backend verification function or refresh subscription immediately
- show a clear success toast:
  ```text
  Trial activated. Your Pro access is ready.
  ```
- if Stripe has not updated instantly, show:
  ```text
  We’re confirming your trial. This usually takes a few seconds.
  ```
  then retry a few times.

This prevents users from returning from Stripe and still seeing “No active plan.”

---

### 6) Make subscription checking more robust

The current `check-subscription` checks Stripe by email. That works, but it is brittle if a customer email changes or duplicate customers exist.

I will improve it by:

- using Stripe customer metadata when available
- checking both `trialing` and `active` subscription states
- also treating `past_due` carefully, depending on whether access should remain or be blocked
- returning consistent fields:
  ```ts
  subscribed
  trial_active
  trial_end
  subscription_status
  subscription_end
  product_id
  is_complimentary
  is_team_member
  ```
- keeping complimentary access logic first so manually granted users bypass Stripe

Files:
- `supabase/functions/check-subscription/index.ts`
- `src/hooks/useSubscription.ts`
- `src/hooks/useFeatureAccess.ts`

---

### 7) Keep complimentary access

Complimentary access will remain supported.

The existing `complimentary_access` table already lets selected users bypass billing. I will not remove that. I will make sure:

- complimentary users are never sent to Stripe Checkout
- subscription UI clearly says:
  ```text
  Complimentary Pro access — no billing required
  ```
- team members still inherit the owner’s paid or complimentary access

---

### 8) Clean up old free-plan language everywhere

I will search and update any remaining old references to:

- “Free”
- “3 locations”
- “1 team member”
- “Upgrade to Pro” where it should say “Start trial” for new users

The intended messaging for new users will be:

```text
ClawOps Pro
7-day free trial
Card required
No charge until trial ends
Unlimited locations
Up to 5 team members
```

Files likely affected:
- `src/pages/Sales.tsx`
- `src/pages/Auth.tsx`
- `src/components/trial/TrialPaywall.tsx`
- `src/components/settings/SubscriptionManager.tsx`
- any limit/toast copy in pages like Team or Locations

---

## Technical implementation details

### Backend checkout function

Update `supabase/functions/create-checkout/index.ts` to:

- require an authenticated user
- accept:
  ```ts
  billing: "monthly" | "annual"
  trial?: boolean
  ```
- choose Stripe price server-side
- validate Stripe key
- validate price exists
- create/reuse Stripe customer
- attach metadata:
  ```ts
  user_id
  email
  source: "clawops"
  ```
- create Checkout Session with:
  ```ts
  mode: "subscription"
  payment_method_collection: "always"
  subscription_data: {
    trial_period_days: 7,
    metadata: { user_id }
  }
  client_reference_id: user.id
  success_url: `${origin}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`
  cancel_url: `${origin}/settings?checkout=cancel`
  ```

### Frontend checkout calls

Replace calls like:

```ts
body: { priceId, trial: true }
```

with:

```ts
body: {
  billing: billingAnnual ? "annual" : "monthly",
  trial: true
}
```

### Subscription confirmation

Update the subscription manager to:

- detect `checkout=success`
- refresh subscription immediately
- retry a few times if Stripe has not reflected the trial yet
- clean up the URL after handling the checkout result

---

## Verification plan

After implementation I will verify these paths:

1. Sales page CTA opens signup in trial mode.
2. New user can create an account without old free-tier messaging.
3. After login, user is sent to Stripe Checkout.
4. Stripe Checkout requires card details for the 7-day trial.
5. Returning from Stripe immediately activates Pro/trial access.
6. Settings page shows trial status and days remaining.
7. Canceling checkout returns the user to a clear billing screen.
8. Existing paid users are not redirected to checkout.
9. Complimentary users bypass Stripe.
10. Team members inherit the owner’s billing status.
11. Old “3 locations / 1 team member” copy is removed from the new-user subscription flow.

---

## Files expected to change

- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/customer-portal/index.ts`
- `src/components/trial/TrialPaywall.tsx`
- `src/components/settings/SubscriptionManager.tsx`
- `src/hooks/useSubscription.ts`
- `src/hooks/useFeatureAccess.ts`
- `src/pages/Auth.tsx`
- `src/pages/Sales.tsx`
- possibly route/page copy where old free-plan limits still appear
