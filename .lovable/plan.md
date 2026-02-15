
## Fix Password Reset Flow and ClawOps Email Branding

### Problem 1: Password Reset Page Crashes
The `/reset-password` route in `App.tsx` is rendered **outside** the `AuthProvider` wrapper. But the `ResetPassword` component calls `useAuth()`, which throws an error because there is no `AuthProvider` ancestor. This means clicking the reset link from the email leads to a broken page.

**Fix:** Wrap the `/reset-password` route with `AuthProvider` in `App.tsx`.

### Problem 2: Reset Emails Say "Loveable"
The password reset emails are sent using the default backend email template, which still has "Loveable" branding. The email template needs to be updated to say "ClawOps" with proper branding and the correct redirect URL pointing to the production domain.

**Fix:** Update the backend auth email templates (password recovery, email confirmation, magic link) to use ClawOps branding.

---

### Changes

**1. `src/App.tsx`**
- Wrap the `/reset-password` route with `AuthProvider` so `useAuth()` works on that page.

```text
Before:
  <Route path="/reset-password" element={<ResetPassword />} />

After:
  <Route path="/reset-password" element={
    <AuthProvider>
      <ResetPassword />
    </AuthProvider>
  } />
```

**2. Backend Auth Email Templates**
Update the password recovery email template to use ClawOps branding:
- **From name**: ClawOps
- **Subject**: "Reset Your ClawOps Password"
- **Body**: ClawOps-branded HTML with the app logo styling and a clear call-to-action button
- Also update the email confirmation template subject/body to reference ClawOps instead of the default

**3. `src/contexts/AuthContext.tsx`**
- Update the `resetPasswordForEmail` redirect URL to use the published production domain (`https://clawops.lovable.app/reset-password`) instead of `window.location.origin`, so the link in the email always points to the correct production site regardless of which environment triggered the reset.
