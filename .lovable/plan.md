
## Password Reset & Show Password + Dashboard Customization Improvements

This plan covers two major enhancements: adding password reset functionality with show/hide password toggles, and redesigning the dashboard customization experience to be more intuitive and user-friendly.

---

## Part 1: Password Features

### Current State
- Login/Signup forms use password fields with type="password" (always hidden)
- No "Forgot Password" functionality exists
- Settings page has password change but no show/hide toggle

### New Features

#### 1.1 Show/Hide Password Toggle
Add an eye icon button to all password fields across the app:

**Files affected:**
- `src/pages/Auth.tsx` (login password, signup password, confirm password)
- `src/pages/Settings.tsx` (current password, new password, confirm password)

**Implementation:**
- Add `showLoginPassword`, `showSignupPassword`, `showSignupConfirmPassword` state variables
- Replace static `type="password"` with dynamic `type={showPassword ? "text" : "password"}`
- Add Eye/EyeOff button inside the input field

**UI Example:**
```text
Password
┌─────────────────────────────────────┐
│ 🔒  mypassword123            👁️    │
└─────────────────────────────────────┘
```

#### 1.2 Forgot Password Flow
Add a complete password reset flow using Supabase's built-in email reset:

**New Routes:**
- Add a "Forgot Password?" link below the login form
- Create a reset password page at `/reset-password`

**Files to create/modify:**
- `src/pages/Auth.tsx` - Add forgot password link and email entry mode
- `src/pages/ResetPassword.tsx` - New page for setting new password after email link
- `src/App.tsx` - Add route for `/reset-password`
- `src/contexts/AuthContext.tsx` - Add `resetPasswordForEmail` function

**Flow:**
1. User clicks "Forgot Password?" on login form
2. Shows email input field with "Send Reset Link" button
3. Calls `supabase.auth.resetPasswordForEmail()` with redirect URL
4. User receives email and clicks link
5. User lands on `/reset-password` page with recovery token
6. User enters new password and confirms
7. Password is updated and user is redirected to dashboard

---

## Part 2: Dashboard Customization Improvements

### Current Problems Identified
1. **Clunky drag-and-drop** - No visual feedback during drag, hard to know where widget will land
2. **Small control buttons** - Hard to tap on mobile
3. **Confusing icons** - Check/X for visibility is unclear
4. **Size cycling** - Clicking to cycle through sizes is tedious; no visual preview
5. **No preview of changes** - Users can't see what different sizes look like before committing
6. **Auto-scroll is jerky** - Current implementation uses recursive requestAnimationFrame

### Solution: Redesigned Customization Panel

#### 2.1 New Customization Overlay Panel
Replace inline controls with a slide-out panel:

**Design:**
```text
┌─────────────────────────────────────────────┐
│ Customize Dashboard                      ✕  │
├─────────────────────────────────────────────┤
│                                             │
│ Drag to reorder widgets                     │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ≡  Primary Stats           👁️  [Full ▼] │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ≡  Weekly Calendar         👁️  [Full ▼] │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ≡  Restock Reminders       👁️  [Half ▼] │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ≡  Maintenance             👁️  [Half ▼] │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Reset to Default]                          │
│                                             │
└─────────────────────────────────────────────┘
```

#### 2.2 Better Size Selection
Replace click-to-cycle with a dropdown menu:

**Size Options with Descriptions:**
- **Small (⅓)** - Fits 3 per row
- **Medium (½)** - Fits 2 per row  
- **Large (⅔)** - Fits 1.5 per row
- **Full** - Takes entire row

#### 2.3 Improved Drag Experience
- Add a drag handle with 6-dot grip icon
- Show drop indicator line between widgets during drag
- Smooth auto-scroll with easing
- Touch-friendly with larger touch targets

#### 2.4 Better Visual Feedback
- Dragged widget gets a shadow and slight scale increase
- Drop target shows a highlighted bar
- Hidden widgets show as dimmed with strikethrough
- Real-time preview of layout changes

### Implementation Details

**File: `src/pages/Dashboard.tsx`**

1. Create a new `DashboardCustomizer` component (can be inline or separate file)
2. Use Sheet/Drawer component for the customization panel
3. Replace the inline controls with the panel
4. Add proper touch event handlers for mobile drag
5. Improve auto-scroll with smooth easing

**New State:**
```typescript
const [customizePanelOpen, setCustomizePanelOpen] = useState(false);
const [tempWidgets, setTempWidgets] = useState<WidgetConfig[]>([]); // Preview state
```

**Size Dropdown:**
```typescript
<Select value={widget.size} onValueChange={(size) => updateWidgetSize(widget.id, size)}>
  <SelectTrigger className="w-24">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="sm">⅓ Small</SelectItem>
    <SelectItem value="md">½ Half</SelectItem>
    <SelectItem value="lg">⅔ Large</SelectItem>
    <SelectItem value="full">Full</SelectItem>
  </SelectContent>
</Select>
```

**Visibility Toggle:**
```typescript
<button onClick={() => toggleVisibility(widget.id)}>
  {widget.visible ? (
    <Eye className="h-5 w-5 text-foreground" />
  ) : (
    <EyeOff className="h-5 w-5 text-muted-foreground" />
  )}
</button>
```

**Better Auto-Scroll:**
```typescript
const smoothAutoScroll = useCallback((clientY: number) => {
  const threshold = 80;
  const maxSpeed = 20;
  const viewportHeight = window.innerHeight;
  
  let speed = 0;
  if (clientY < threshold) {
    // Ease-in as you get closer to edge
    speed = -maxSpeed * (1 - clientY / threshold);
  } else if (clientY > viewportHeight - threshold) {
    speed = maxSpeed * (1 - (viewportHeight - clientY) / threshold);
  }
  
  if (speed !== 0) {
    window.scrollBy({ top: speed, behavior: 'instant' });
  }
}, []);
```

---

## Files to Modify/Create

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Add show/hide password toggles, forgot password link, email reset UI |
| `src/pages/ResetPassword.tsx` | **NEW** - Password reset page after email link |
| `src/pages/Settings.tsx` | Add show/hide password toggles to security section |
| `src/App.tsx` | Add `/reset-password` route |
| `src/contexts/AuthContext.tsx` | Add `resetPasswordForEmail` function |
| `src/pages/Dashboard.tsx` | Redesign customization with panel, dropdown sizes, better drag UX |

---

## Implementation Order

1. **Show/Hide Password Toggles** - Quick wins for Auth.tsx and Settings.tsx
2. **Forgot Password Link & Email Form** - Update Auth.tsx with reset email request
3. **Reset Password Page** - Create new page and route
4. **AuthContext Update** - Add reset function
5. **Dashboard Panel Component** - Create the slide-out customization panel
6. **Size Dropdown** - Replace cycle button with select dropdown
7. **Improved Drag UX** - Better visual feedback and smooth scrolling
8. **Touch Support** - Ensure mobile drag works smoothly

---

## Technical Notes

### Password Reset Security
- Uses Supabase's built-in `resetPasswordForEmail` which sends a secure one-time link
- Recovery tokens are handled automatically by Supabase
- The `/reset-password` route detects the recovery session from URL hash/params

### Dashboard Customization UX
- Changes are applied in real-time for immediate feedback
- Auto-saves to localStorage on every change
- Reset button restores factory defaults
- Panel closes automatically when clicking "Done"

### Accessibility
- Password visibility toggles include aria-labels
- Keyboard navigation for all controls
- Focus management in the customization panel
