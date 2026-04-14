

## Fix Signup Flow: Remove Free Tier, Streamline Trial Checkout

### What is wrong today

1. **SubscriptionManager.tsx** still displays "Free · 3 locations, 1 team member" for non-subscribed users. This is the old Free tier text.
2. **subscriptionTiers.ts** still defines a `FREE` tier with `maxLocations: 3` and `maxTeamMembers: 1`.
3. The signup flow requires creating a Supabase account first, then separately entering payment info on the TrialPaywall. This feels disjointed.
4. Stripe Checkout cannot replace Supabase account creation because the entire app (RLS policies, data access) depends on Supabase auth. However, we can make it feel like one step.

### What will change

**1. Remove the FREE tier entirely**

- `src/config/subscriptionTiers.ts`: Remove the `FREE` object. New users without a subscription get zero access (paywall), not a limited free tier.
- `src/hooks/useFeatureAccess.ts`: When not Pro, set limits to 0 (blocked) instead of 3/1.
- `src/components/settings/SubscriptionManager.tsx`: Replace "Free · 3 locations, 1 team member" with "No active plan — start your trial to get access."

**2. Auto-redirect to Stripe Checkout after signup + email verification**

Instead of showing the TrialPaywall as a separate screen after login, automatically invoke `create-checkout` with `trial: true` as soon as a new user (post-cutoff) logs in for the first time. The flow becomes:

```text
Sales "Start Free Trial" → /auth?tab=signup&trial=true
  → User fills in name/email/password → Verify email → Log in
  → App detects requiresTrialCheckout → auto-calls create-checkout
  → Redirects to Stripe Checkout (collects credit card, 7-day trial)
  → Returns to /settings?checkout=success → Full app access
```

Changes in `TrialPaywall.tsx`: Add an `autoCheckout` mode that immediately invokes checkout on mount (with a loading spinner) instead of showing the manual button. Show the manual paywall only as a fallback if auto-checkout fails.

**3. Keep complimentary access unchanged**

The `complimentary_access` table and the `check-subscription` edge function already handle this. No changes needed — complimentary users bypass all payment requirements.

**4. Update SubscriptionManager for post-cutoff users**

For users created after the cutoff who have no subscription, show "No active plan" with a button to start the trial, instead of showing the old free tier info.

### Files to modify

| File | Change |
|---|---|
| `src/config/subscriptionTiers.ts` | Remove `FREE` tier object, replace with `NONE` having 0/0 limits |
| `src/hooks/useFeatureAccess.ts` | Use `NONE` tier (0 limits) instead of `FREE` when not Pro |
| `src/components/settings/SubscriptionManager.tsx` | Update "Free" display text to "No active plan" for post-cutoff users; keep legacy free display for pre-cutoff users |
| `src/components/trial/TrialPaywall.tsx` | Add auto-checkout on mount — immediately redirect to Stripe instead of showing a button. Show manual fallback on error. |

### Complimentary access

No changes. The existing `complimentary_access` database table continues to work. You can grant complimentary access to anyone by adding a row to that table with their user ID.

