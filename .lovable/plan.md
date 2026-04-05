

## Fix Password Reset Flow

### Problems Found

1. **Hardcoded redirect URL**: `resetPasswordForEmail` in `AuthContext.tsx` hardcodes `https://clawops.lovable.app/reset-password` but the app is now served from `clawops.com`. Users clicking the reset link land on the wrong domain, so the recovery session never reaches the actual app.

2. **Race condition in ResetPassword.tsx**: The `useEffect` sets `isCheckingSession(false)` synchronously *before* the `onAuthStateChange` listener has a chance to fire with `PASSWORD_RECOVERY`. This means users often see "Invalid or Expired Link" even with a valid token, because the check completes before the auth event arrives.

3. **Config mismatch**: `supabase/config.toml` has `site_url = "https://clawops.lovable.app"` and `additional_redirect_urls` pointing to the old domain. These should reference `clawops.com`.

4. **Auth logs confirm**: A 422 on `PUT /user` from `clawops.com` referer — the recovery session established on the old domain doesn't carry over properly.

### Fix Plan

**File: `src/contexts/AuthContext.tsx`**
- Change the hardcoded redirect URL to use `window.location.origin + '/reset-password'` so it works on any domain (preview, lovable.app, clawops.com).

**File: `src/pages/ResetPassword.tsx`**
- Fix the race condition: add a short delay or use a timeout before declaring the session invalid, giving `onAuthStateChange` time to fire with `PASSWORD_RECOVERY`.
- Also parse the URL hash for `type=recovery` as a direct check — if present, exchange the token immediately rather than relying solely on the event listener.
- Improve error messaging: show the actual error from `updatePassword` instead of a generic message.

**File: `supabase/config.toml`**
- Update `site_url` to `https://clawops.com`
- Update `additional_redirect_urls` to include `https://clawops.com/reset-password`

### Summary

| File | Change |
|---|---|
| `AuthContext.tsx` | Dynamic redirect URL using `window.location.origin` |
| `ResetPassword.tsx` | Fix session detection race condition; parse URL hash for recovery token; better error messages |
| `supabase/config.toml` | Update URLs to `clawops.com` |

