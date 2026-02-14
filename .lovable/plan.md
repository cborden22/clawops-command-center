

## Add Password Strength Requirements Display

### What This Does

When a user is creating or resetting a password, they will see a live checklist showing which requirements their password meets. This gives clear, real-time feedback instead of only showing an error after submission.

### Password Requirements

The following rules will be checked and displayed:
- At least 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&* etc.)

### Where It Appears

1. **Sign Up page** (`src/pages/Auth.tsx`) -- below the password field
2. **Reset Password page** (`src/pages/ResetPassword.tsx`) -- below the new password field

### What It Looks Like

A small list of requirements below the password input, each with a colored icon:
- Grey circle when not yet met
- Green checkmark when met

The submit button validation (zod schema) will also be updated to enforce all five rules, not just the 8-character minimum.

### Changes

**New file: `src/components/shared/PasswordRequirements.tsx`**
- A reusable component that takes the current password string as a prop
- Renders a list of 5 requirements with live check/uncheck icons
- Uses `Check` and `Circle` icons from lucide-react with green/muted colors

**Modified: `src/pages/Auth.tsx`**
- Import and render `PasswordRequirements` below the signup password field
- Update `passwordSchema` to enforce uppercase, lowercase, number, and special character in addition to min length

**Modified: `src/pages/ResetPassword.tsx`**
- Import and render `PasswordRequirements` below the new password field
- Update `passwordSchema` to match the same stricter rules

### Technical Detail

The updated zod schema:
```typescript
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character");
```

The `PasswordRequirements` component checks each rule independently against the current input value and renders the checklist with immediate visual feedback as the user types.

