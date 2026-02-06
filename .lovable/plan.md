

## Fix Password Update Failing (422 Error)

### Problem Confirmed
The auth logs show:
- `POST /token` (signInWithPassword) returns **200** (success)
- `PUT /user` (updateUser) returns **422** (unprocessable entity)

This indicates the password verification works, but the password update itself fails.

---

### Root Cause Analysis

The 422 error can occur because:

1. **Session conflict**: When `signInWithPassword` is called, it creates new session tokens. The `updateUser` call immediately after may be using stale session data, causing a mismatch.

2. **Reauthentication still required**: Even with "Secure password change" disabled, the backend may still expect the session to be in a specific state.

3. **Password policy violation**: The new password may be in a breached password list or doesn't meet backend requirements.

---

### Solution

Replace the current "verify then update" flow with a more reliable approach:

**Option A: Use the session from signIn directly**

After `signInWithPassword` succeeds, the Supabase client automatically updates its internal session. However, there may be a race condition. We should:
1. Wait for the session to propagate
2. Then call `updateUser`

**Option B: Remove the pre-verification step (Recommended)**

Since the user is already authenticated (logged in), we don't need to call `signInWithPassword` to verify. We can:
1. Directly call `updateUser` with the new password
2. If it fails due to security requirements, show a helpful error

However, this removes the "confirm current password" security check. 

**Option C: Use reauthenticate flow**

Call `supabase.auth.reauthenticate()` which sends an OTP to the user's email, then use that nonce for `updateUser`. This is more complex but most secure.

---

### Recommended Implementation (Option A - Fixed)

The issue is that after `signInWithPassword`, we need to ensure the session is fully updated before calling `updateUser`. We'll add a small delay and ensure we're using the fresh session:

```typescript
const handleUpdatePassword = async () => {
  // ... validation checks ...

  setIsUpdatingPassword(true);
  try {
    // Verify the current password
    const { data: signInData, error: verifyError } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: currentPassword,
    });

    if (verifyError) {
      toast({
        title: "Verification Failed",
        description: "Invalid current password. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Small delay to ensure session is fully updated
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update password with fresh session
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      // Check for specific error types
      if (error.message?.includes("same_password") || error.message?.includes("different")) {
        toast({
          title: "Password Error",
          description: "New password must be different from your current password.",
          variant: "destructive",
        });
        return;
      }
      throw error;
    }

    // Success
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
  } catch (error: any) {
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

---

### Additional Fix: Improved Error Handling

Update the `getSafeErrorMessage` function to handle more 422 error cases:

```typescript
const getSafeErrorMessage = (error: Error | any): string => {
  const message = error?.message?.toLowerCase() || "";
  const code = error?.code || "";
  
  if (message.includes("invalid login") || message.includes("invalid credentials")) {
    return "Invalid current password. Please try again.";
  }
  if (message.includes("same_password") || code === "same_password") {
    return "New password must be different from your current password.";
  }
  if (message.includes("weak_password") || message.includes("too weak")) {
    return "Password is too weak. Please choose a stronger password.";
  }
  if (message.includes("reauthentication") || code === "reauthentication_needed") {
    return "Please try logging out and back in, then update your password.";
  }
  if (message.includes("password")) {
    return "Password update failed. Please try again.";
  }
  return "An error occurred. Please try again.";
};
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | Add delay after signIn, improve error handling for 422 cases |

---

### Verification Steps

After implementation:
1. Go to **Settings > Security**
2. Enter current password, new password, and confirm
3. Click "Update Password"
4. Should see success message "Password Updated"
5. Log out and log back in with the new password to verify

