
## Fix Password Minimum Length to 8 Characters

### Problem
The password validation schema in both the Auth (login/signup) and ResetPassword pages is set to require only 6 characters minimum, but it should require 8 characters.

### Current Code
Both files have:
```typescript
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
```

### Solution
Update the password schema in both files to require 8 characters minimum.

---

### Files to Modify

| File | Line | Change |
|------|------|--------|
| `src/pages/Auth.tsx` | 15 | Change min(6) to min(8) and update message |
| `src/pages/ResetPassword.tsx` | 13 | Change min(6) to min(8) and update message |

---

### Technical Details

**Auth.tsx (line 15):**
```typescript
// Before
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

// After
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
```

**ResetPassword.tsx (line 13):**
```typescript
// Before
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

// After
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
```

---

### What's Already Working
The following features are already implemented and working correctly:
- "Forgot password?" link on the login form
- Password visibility toggle on login form
- Password visibility toggles on signup form (both password fields)
- Password visibility toggles on reset password form (both password fields)

---

### Testing After Implementation
1. Try to sign up with a 7-character password - should show validation error requiring 8 characters
2. Try to reset password with a 7-character password - should show validation error
3. Verify the visibility toggle still works on all password fields
