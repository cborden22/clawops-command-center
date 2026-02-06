

## Fix Password Update Failing

### Problem Identified
The password update is failing with a **422 error** because Supabase's "Secure password change" setting is enabled. This setting requires using `supabase.auth.reauthenticate()` which sends an OTP to the user's email, and then passing that OTP as a `nonce` when calling `updateUser()`.

The current implementation incorrectly uses `signInWithPassword()` to "verify" the current password, which doesn't satisfy Supabase's reauthentication requirement.

---

### Solution Options

| Option | Approach | Complexity | Security Level |
|--------|----------|------------|----------------|
| **A** | Disable "Secure password change" + keep current password verification | Simple | Medium |
| **B** | Implement full OTP reauthentication flow | Complex | High |

**Recommended: Option A** - The current flow already verifies the user's identity by requiring them to enter their current password and successfully sign in. This provides adequate security for most use cases.

---

### Implementation Plan

#### Step 1: Update Auth Settings
Use the configure-auth tool to disable "Secure password change" setting.

#### Step 2: Fix the Password Update Flow (Settings.tsx)
The current code has a subtle issue - after calling `signInWithPassword()` to verify, it should work. But we need to ensure the session isn't being disrupted.

**Current problematic flow:**
```typescript
// 1. Verify with signInWithPassword (creates new session tokens)
await supabase.auth.signInWithPassword({ email, password: currentPassword });

// 2. Immediately try to update (may conflict with session refresh)
await supabase.auth.updateUser({ password: newPassword });
```

**Fixed flow:**
```typescript
// 1. Verify current password
const { error: verifyError } = await supabase.auth.signInWithPassword({
  email: user?.email || "",
  password: currentPassword,
});

if (verifyError) {
  // Handle error
  return;
}

// 2. Update password (after disabling secure password change, this will work)
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

The code logic is correct - the issue is purely the "Secure password change" setting blocking the update.

---

### Additional Validation
Add a check to prevent setting the same password (which also causes 422):

```typescript
if (currentPassword === newPassword) {
  toast({
    title: "Same Password",
    description: "New password must be different from current password.",
    variant: "destructive",
  });
  return;
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| Auth Settings | Disable "Secure password change" via configure-auth tool |
| `src/pages/Settings.tsx` | Add validation to prevent same password, improve error handling |

---

### Technical Details

The `handleUpdatePassword` function in Settings.tsx (lines 157-235) needs these updates:

1. Add check for same password (before API calls)
2. Improve error handling to detect specific error codes like `same_password` or `reauthentication_needed`
3. Optionally add a small delay between signIn and updateUser to ensure session is stable

