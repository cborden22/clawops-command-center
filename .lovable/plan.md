
## Fix the broken new-user trial flow

### What I found
This is not mainly a Sales page issue anymore.

From the current code and auth config, there are 3 likely problems causing the flow to feel broken:

1. **Signup on `www.clawops.com` can fail with 422**
   - `signUp()` uses `window.location.origin` as the email confirmation redirect.
   - On `www.clawops.com`, that becomes `https://www.clawops.com/`.
   - Your auth config currently allowlists `https://clawops.com` and reset-password URLs, but **not** `https://www.clawops.com/`.
   - That mismatch can cause signup failure on the live domain.

2. **The app is forcing users through account creation first**
   - That part is actually required because checkout is tied to an authenticated user.
   - But right now the UX feels wrong because after signup/login, users are not handed into billing smoothly enough.

3. **Checkout currently opens in a new tab**
   - `TrialPaywall` uses `window.open(data.url, "_blank")`.
   - This can feel broken and can be blocked by pop-up settings.
   - For a payment flow, same-tab redirect is safer.

### Implementation plan

#### 1) Fix allowed auth redirect URLs
Update backend auth redirect configuration so signup and reset flows work on all live domains:
- `https://www.clawops.com`
- `https://www.clawops.com/reset-password`
- keep:
  - `https://clawops.com`
  - `https://clawops.com/reset-password`
  - `https://clawops.lovable.app/reset-password`

I’ll also make the frontend use a **safe canonical redirect URL helper** instead of blindly using `window.location.origin`.

Files/settings:
- `supabase/config.toml`
- `src/contexts/AuthContext.tsx`
- possibly a small helper file like `src/lib/authRedirect.ts`

#### 2) Make signup/login hand off cleanly into billing
Keep the required sequence:
```text
Sales page -> Create account -> Verify email -> Log in -> Stripe trial checkout -> App
```

But make it feel seamless by preserving **trial intent** from the Sales page through auth, then automatically guiding eligible new users into checkout after login.

Changes:
- keep Sales CTA pointing to `/auth?tab=signup&trial=true`
- in `Auth.tsx`, preserve that trial intent after login/signup flow
- in the protected flow, if a newly authenticated user came from the trial path and requires billing, trigger the trial checkout immediately or show a very explicit one-step “Continue to secure billing” handoff

Files:
- `src/pages/Auth.tsx`
- `src/App.tsx`
- `src/components/trial/TrialPaywall.tsx`

#### 3) Replace popup checkout with same-tab redirect
Change checkout launch from:
```ts
window.open(data.url, "_blank")
```
to a direct redirect:
```ts
window.location.href = data.url
```

This applies to:
- trial checkout
- regular upgrade checkout

That will reduce blocked popups and make the payment step feel intentional.

Files:
- `src/components/trial/TrialPaywall.tsx`
- `src/components/settings/SubscriptionManager.tsx`

#### 4) Harden auth error handling so failures are obvious
The current signup error handling is better than before, but I’ll make it more reliable and specific so users don’t get vague failures.

I’ll:
- surface the exact backend-safe auth error when available
- add a clearer message for invalid redirect / signup configuration issues
- keep rate-limit and duplicate-account handling explicit
- improve trial-specific copy so users understand why account creation comes before billing

File:
- `src/pages/Auth.tsx`

### Technical notes
- **Root cause most likely**: redirect allowlist mismatch for `www.clawops.com`
- **No impact to existing users**: this only fixes auth + new-user trial onboarding
- **Subscription model remains unchanged**: 7-day trial with card required for new users only
- **Sales page itself is already mostly correct**; the broken behavior is downstream in auth/checkout

### Verification after implementation
I will test these exact paths:
1. `https://www.clawops.com/sales` -> Start Free Trial -> signup form opens on signup tab
2. Create a brand-new account on `www` domain without 422 failure
3. Verify email link lands correctly
4. Log in as that new user and confirm handoff to Stripe trial checkout works
5. Confirm checkout opens in same tab
6. Confirm existing/legacy user login is unaffected
7. Confirm trial users return successfully after checkout

### Files I expect to touch
- `supabase/config.toml`
- `src/contexts/AuthContext.tsx`
- `src/pages/Auth.tsx`
- `src/App.tsx`
- `src/components/trial/TrialPaywall.tsx`
- `src/components/settings/SubscriptionManager.tsx`
