

## Fix Password Change with OTP Verification

### Problem
The password update keeps failing with a **422 error** on `PUT /user`. Despite disabling "Secure password change" in auth settings and adding session delays, the update still fails immediately. The logs confirm the issue persists.

### Root Cause
The backend may have cached the old "Secure password change" requirement, or there's a fundamental session token conflict when calling `signInWithPassword` followed by `updateUser`. The 100ms delay wasn't sufficient to resolve this.

### Solution: OTP Reauthentication Flow
Implement the official Supabase reauthentication flow:

1. User enters their new password
2. Click "Request Code" - sends an OTP to their email via `supabase.auth.reauthenticate()`
3. User enters the 6-digit code from their email
4. Click "Update Password" - updates password with `supabase.auth.updateUser({ password, nonce })`

This is the most reliable approach and matches what you selected ("Email code (OTP)").

---

### Implementation Details

#### Step 1: Update Settings.tsx - Add OTP State Variables

```typescript
// Add new state for OTP flow
const [otpCode, setOtpCode] = useState("");
const [otpSent, setOtpSent] = useState(false);
const [isSendingOtp, setIsSendingOtp] = useState(false);
```

#### Step 2: Create "Request Code" Function

```typescript
const handleRequestOtp = async () => {
  // Validate new password fields first
  if (!newPassword || !confirmPassword) {
    toast({ title: "Enter New Password", description: "...", variant: "destructive" });
    return;
  }
  if (newPassword !== confirmPassword) { /* validation */ }
  if (newPassword.length < 6) { /* validation */ }

  setIsSendingOtp(true);
  try {
    const { error } = await supabase.auth.reauthenticate();
    if (error) throw error;
    
    setOtpSent(true);
    toast({
      title: "Code Sent",
      description: "Check your email for a 6-digit verification code.",
    });
  } catch (error) {
    toast({
      title: "Failed to Send Code",
      description: "Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsSendingOtp(false);
  }
};
```

#### Step 3: Update Password Function with Nonce

```typescript
const handleUpdatePassword = async () => {
  if (!otpCode) {
    toast({ title: "Enter Code", description: "Enter the 6-digit code from your email.", variant: "destructive" });
    return;
  }

  setIsUpdatingPassword(true);
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      nonce: otpCode  // The OTP code proves identity
    });

    if (error) throw error;

    // Success - clear all fields
    setNewPassword("");
    setConfirmPassword("");
    setOtpCode("");
    setOtpSent(false);
    
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
  } catch (error) {
    toast({
      title: "Error",
      description: getSafeErrorMessage(error),
      variant: "destructive",
    });
  } finally {
    setIsUpdatingPassword(false);
  }
};
```

#### Step 4: Update UI in Security Tab

Remove "Current Password" field (no longer needed with OTP).

Add new UI flow:
```
+-------------------------------------+
|  New Password          [••••••] 👁  |
|  Confirm Password      [••••••] 👁  |
+-------------------------------------+
|  [ Request Code ]  (sends OTP)      |
+-------------------------------------+
|  Verification Code   [______]       |  <- Only shown after OTP sent
|  [ Update Password ]                |
+-------------------------------------+
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | Replace current password flow with OTP flow |

---

### User Experience

1. Go to Settings > Security
2. Enter new password and confirm
3. Click "Request Code"
4. Check email for 6-digit code
5. Enter code and click "Update Password"
6. Success message shown

---

### Technical Notes

- `supabase.auth.reauthenticate()` sends a reauthentication nonce (OTP) to the user's registered email
- The `nonce` parameter in `updateUser()` tells Supabase this is a verified password change
- No need for current password entry since the OTP proves identity
- This bypasses all the session token conflicts we've been experiencing

