

## Revamp Subscription: Mandatory 7-Day Free Trial for New Users

### Problem
Currently, new users get a Free tier (3 locations, 1 team member) with no time limit and no card required. You want new signups to be required to enter a credit card and start a 7-day free trial of Pro, after which they're charged. Existing/past users must not be affected.

### Approach
Use Stripe Checkout with `subscription_data.trial_period_days: 7` so new users must enter a card but aren't charged until day 8. To distinguish new users from existing ones, we check account creation date — anyone who signed up before this change ships keeps their current behavior.

### How It Works

```text
New User Flow:
  Sign Up → Verify Email → Log In → Paywall Screen → Stripe Checkout (7-day trial) → App

Existing User Flow (unchanged):
  Log In → App (Free or Pro as before)
```

**Cutoff date**: A constant (e.g. `2026-04-15`) stored in `subscriptionTiers.ts`. Users created before this date keep the old Free tier. Users created on or after are considered "new" and must complete the trial checkout.

### Changes

| File | Change |
|---|---|
| `src/config/subscriptionTiers.ts` | Add `TRIAL_CUTOFF_DATE` constant and `TRIAL_DAYS: 7`. |
| `supabase/functions/create-checkout/index.ts` | Accept an optional `trial` boolean in the request body. When true, add `subscription_data: { trial_period_days: 7 }` to the Stripe checkout session. |
| `supabase/functions/check-subscription/index.ts` | Return `trial_active` and `trial_end` fields when the user's Stripe subscription has status `trialing`. Also return `created_at` from the user's profile so the frontend knows if they're a new user. |
| `src/hooks/useSubscription.ts` | Add `isTrial`, `trialEnd`, and `userCreatedAt` to the state returned from the hook. |
| `src/hooks/useFeatureAccess.ts` | Add `requiresTrialCheckout` flag: true when the user was created after the cutoff date AND has no active subscription/trial/complimentary access. Trialing users get Pro access. |
| `src/components/trial/TrialPaywall.tsx` | **New file**. A full-screen paywall component shown when `requiresTrialCheckout` is true. Shows "Start your 7-day free trial" messaging, Pro feature list, and a single "Start Free Trial" button that calls `create-checkout` with `trial: true`. Also shows the price they'll be charged after the trial ($19/mo or $190/yr with a toggle). |
| `src/App.tsx` | Wrap `ProtectedRoute` children: after auth check, if `requiresTrialCheckout` is true, render `TrialPaywall` instead of the app. Settings page is still accessible so users can manage billing. |
| `src/components/settings/SubscriptionManager.tsx` | Show trial status badge ("Trial · X days left") for trialing users. Show "Your trial has ended — subscribe to continue" for expired trial users. |

### Key Technical Details

- **Stripe trial checkout**: `stripe.checkout.sessions.create({ ..., subscription_data: { trial_period_days: 7 } })` — Stripe collects the card but charges $0 until day 8.
- **Existing users unaffected**: The `requiresTrialCheckout` flag only activates for users created after the cutoff date. Users created before that date keep the existing Free/Pro flow.
- **Trial = Pro access**: While trialing, `useFeatureAccess` treats the user as Pro (unlimited locations, 5 team members).
- **After trial expires**: If the user doesn't convert, Stripe cancels the subscription. The check-subscription function returns `subscribed: false`, and the paywall reappears.
- **Team members**: Team members still inherit their owner's subscription status — no change there.

