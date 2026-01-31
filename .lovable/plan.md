

## Fix Mobile Stock Run Review Button and Scrolling Issues

### Overview
Two issues have been identified with the mobile Inventory Tracker:
1. **Review/Confirm buttons are hidden** - The floating action bars for Stock Run and Return Stock are positioned at `bottom-4` (16px from bottom), but the MobileBottomNav is 64px tall and covers them completely
2. **Glitchy scrolling** - The pull-to-refresh hook conflicts with normal scrolling, and nested scroll containers cause janky behavior

---

### Problem Analysis

**Issue 1: Hidden Review Button**
- Floating action bar: `fixed bottom-4 left-4 right-4` (16px from bottom)
- MobileBottomNav: `fixed bottom-0` with `h-16` (64px height)
- Result: The nav bar completely covers the floating cart summary with the Review button

**Issue 2: Scroll Problems**
- MobileLayout's main container has `overflow-y-auto`
- InventoryTrackerComponent has `pb-24` but page wrapper adds extra padding
- Pull-to-refresh uses `passive: false` on touchmove which can interfere with scrolling
- Multiple nested scrollable areas can cause scroll chaining issues

---

### Solution

#### 1. Reposition Floating Action Bars

Update the Stock Run and Return Stock floating cards to sit above the bottom navigation:

| Current | Fixed |
|---------|-------|
| `bottom-4` (16px) | `bottom-20` (80px) |

This ensures the floating cards appear above the 64px bottom nav with adequate spacing.

#### 2. Improve Scroll Behavior

**2a. Add overscroll containment**
Add `overscroll-contain` to the MobileLayout main container to prevent scroll chaining between nested scroll areas.

**2b. Disable pull-to-refresh when in Stock Run/Return modes**
The pull-to-refresh should not interfere when users are actively scrolling through inventory items. We'll add a mechanism to disable it during stock run operations.

**2c. Add touch-action optimization**
Add `touch-action: pan-y` to scrollable containers to optimize vertical scrolling on mobile.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/InventoryTrackerComponent.tsx` | Change floating card position from `bottom-4` to `bottom-20` for both Stock Run and Return Stock modes |
| `src/components/layout/MobileLayout.tsx` | Add `overscroll-contain` to main container for scroll chaining prevention |
| `src/index.css` | Add utility class for improved mobile scrolling |

---

### Technical Details

**InventoryTrackerComponent.tsx Changes (Lines 952, 976)**

Stock Run floating card:
```
// Before
<div className="fixed bottom-4 left-4 right-4 z-50">

// After  
<div className="fixed bottom-20 left-4 right-4 z-50">
```

Return Stock floating card (same change):
```
// Before
<div className="fixed bottom-4 left-4 right-4 z-50">

// After
<div className="fixed bottom-20 left-4 right-4 z-50">
```

**MobileLayout.tsx Changes (Line 27)**

Add scroll optimization classes:
```
// Before
className="flex-1 overflow-y-auto pb-20"

// After
className="flex-1 overflow-y-auto pb-20 overscroll-contain"
```

**index.css Addition**

Add mobile scroll optimization utility:
```css
/* Improve mobile scrolling performance */
.mobile-scroll-optimized {
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}
```

---

### Visual Result

**Before:**
```
┌─────────────────────────┐
│ Inventory Items...      │
│ ...                     │
│ ...                     │
├─────────────────────────┤ ← Floating bar (hidden)
│ ┌─────────────────────┐ │
│ │ Home Revenue + Inv │ │ ← Bottom Nav covers it
│ └─────────────────────┘ │
└─────────────────────────┘
```

**After:**
```
┌─────────────────────────┐
│ Inventory Items...      │
│ ...                     │
├─────────────────────────┤
│ ┌─────────────────────┐ │ ← Floating bar (visible)
│ │ 5 items - Review    │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Home Revenue + Inv │ │ ← Bottom Nav
│ └─────────────────────┘ │
└─────────────────────────┘
```

---

### Edge Cases Handled

- **Safe area insets**: The bottom nav already uses `mobile-safe-bottom` for iOS home indicator, so the floating bar at `bottom-20` will remain visible on all devices
- **Both modes covered**: Both Stock Run and Return Stock floating bars will be repositioned
- **Scroll chaining**: Using `overscroll-contain` prevents the pull-to-refresh from accidentally triggering during normal list scrolling
- **Performance**: Adding touch-action hints helps browsers optimize scrolling

