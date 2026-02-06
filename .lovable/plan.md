

## Fix OTP Code Length (6 → 8 digits)

### Problem
The Supabase `reauthenticate()` function sends an **8-character** verification code to the user's email, but the current UI and validation logic only accepts 6 digits.

### Root Cause
Supabase's reauthentication OTP is 8 characters by default, not 6. The UI implementation assumed 6 digits.

---

### Solution
Update all references from 6 to 8 in the password change flow:

---

### Changes Required

| Location | Current | Updated |
|----------|---------|---------|
| Toast message (line 206) | "6-digit verification code" | "8-digit verification code" |
| Validation check (line 221) | `otpCode.length < 6` | `otpCode.length < 8` |
| Toast message (line 224) | "6-digit code" | "8-digit code" |
| Input maxLength (line 694) | `maxLength={6}` | `maxLength={8}` |
| Input placeholder (line 695) | "Enter 6-digit code" | "Enter 8-digit code" |
| Button disabled check (line 719) | `otpCode.length < 6` | `otpCode.length < 8` |

---

### File to Modify

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | Update all OTP length references from 6 to 8 |

---

### After Implementation

1. Go to **Settings > Security**
2. Enter new password and confirm
3. Click **Request Verification Code**
4. Check email for the **8-digit** code
5. Enter the full 8-digit code
6. Click **Update Password**

