

## Fix Trial Signup Flow and Error Handling

### Problems Identified

1. **Confusing CTA flow**: The "Start Free Trial" button on the Sales page sends users to `/auth` (sign-up form). Users expect it to go straight to Stripe. However, Stripe checkout *requires* an authenticated user (the edge function validates the auth token). So the user must sign up first. The fix is to make this flow feel seamless rather than confusing.

2. **Signup failure (422)**: The auth logs show a 422 on `/signup`. With `enable_confirmations = true` in the config, Supabase returns a fake 200 success for duplicate emails (to prevent user enumeration) — but it returns 422 when the email format is invalid or when rate-limited. The current error handler only checks for "already registered" / "already exists" messages and falls through to a generic "Sign up Failed" for anything else. The error handling needs to show the actual error message from Supabase instead of a generic failure.

### Changes

| File | Change |
|---|---|
| `src/pages/Sales.tsx` | Update all "Start Free Trial" links from `/auth` to `/auth?tab=signup&trial=true` so the Auth page opens on the signup tab with trial context. |
| `src/pages/Auth.tsx` | 1. Read `tab` and `trial` query params on mount. If `tab=signup`, default to signup tab. If `trial=true`, show messaging like "Create your account to start your 7-day free trial". 2. Improve signup error handling: show the actual Supabase error message instead of generic "Sign up Failed". 3. After successful signup + email verification + login, the existing `TrialPaywall` interceptor in `App.tsx` handles the Stripe redirect automatically — no code change needed there. |
| `src/components/trial/TrialPaywall.tsx` | No changes needed — already correctly calls `create-checkout` with `trial: true`. |

### Detailed Auth.tsx Changes

- Use `useSearchParams` to read `tab` and `trial` params
- Set `Tabs` `defaultValue` to `signup` when `tab=signup`
- Add a banner above the form when `trial=true`: "Sign up to start your 7-day free trial — no charge until it ends"
- In `handleSignup` error handler, replace the generic "Signup Failed" / "Unable to create account" with the actual `error.message` from Supabase so the user sees what went wrong (e.g., rate limit, invalid email, etc.)
- Add a catch for messages containing "rate" to show a rate-limit-specific message

### User Flow After Fix

```text
Sales page "Start Free Trial"
  → /auth?tab=signup&trial=true (signup form with trial messaging)
  → User signs up → verifies email → logs in
  → TrialPaywall intercepts (already implemented) → Stripe Checkout (7-day trial)
  → Success → full app access
```

This is a small, targeted fix to 2 files that addresses both the confusing UX and the generic error messaging.

