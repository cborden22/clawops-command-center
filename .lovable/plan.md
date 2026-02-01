

## Fix Mobile UI Scrolling and Flow Issues

This plan addresses the scrolling difficulties on iOS and Android by implementing comprehensive mobile scroll optimizations and fixing layout conflicts that cause poor user experience.

---

## Problems Identified

| Issue | Impact | Affected Areas |
|-------|--------|----------------|
| `min-h-screen` on page containers | Double/nested scrolling when inside MobileLayout | All pages |
| Missing iOS scroll momentum | Laggy scrolling on iPhone | Sheets, dialogs, page content |
| QuickAddSheet fixed height conflicts | Content cut off on smaller screens | Quick Add forms |
| Body-level overscroll not controlled | Pull-to-refresh interferes with native browser behavior | Entire app |
| Sheet content not scroll-optimized | Jerky scrolling in bottom sheets | All bottom sheets |
| Dialog content touch handling | Dialogs hard to scroll on mobile | RouteEditor, other dialogs |

---

## Solution Overview

```text
+----------------------------------------------------------+
|  BEFORE (Problems)                                        |
+----------------------------------------------------------+
|  - MobileLayout main: overflow-y-auto                     |
|  - Page content: min-h-screen (conflicts!)                |
|  - Sheets: No touch optimization                          |
|  - Body: No overscroll control                            |
+----------------------------------------------------------+

+----------------------------------------------------------+
|  AFTER (Fixed)                                            |
+----------------------------------------------------------+
|  - MobileLayout: Proper scroll containment               |
|  - Pages: Remove min-h-screen on mobile                   |
|  - Sheets: Full touch optimization with safe areas        |
|  - Body: overscroll-behavior: none on mobile              |
|  - Global: Better iOS momentum scrolling                  |
+----------------------------------------------------------+
```

---

## File Changes

| File | Changes |
|------|---------|
| `src/index.css` | Add global mobile scroll fixes, body overscroll, iOS momentum classes |
| `src/components/layout/MobileLayout.tsx` | Improve scroll container styling, add safe area handling |
| `src/components/ui/sheet.tsx` | Add touch-optimized scrolling for sheet content |
| `src/components/ui/dialog.tsx` | Add mobile scroll optimization to dialog content |
| `src/components/mobile/QuickAddSheet.tsx` | Fix scroll area calculation with safe areas |
| `src/pages/MileageTracker.tsx` | Remove min-h-screen, use mobile-friendly height |
| `src/pages/RevenueTracker.tsx` | Remove min-h-screen, use mobile-friendly height |
| `src/pages/Locations.tsx` | Remove min-h-screen, use mobile-friendly height |
| `src/pages/Dashboard.tsx` | Add mobile scroll optimization |

---

## Implementation Details

### 1. Global CSS Improvements (`src/index.css`)

Add enhanced mobile scroll utilities:

```css
/* Global body scroll control for mobile */
html, body {
  overscroll-behavior-y: none; /* Prevent pull-to-refresh interference */
}

/* Enhanced mobile scroll class */
.mobile-scroll-optimized {
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: contain;
}

/* Sheet/dialog scroll optimization */
.sheet-scroll-content {
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: contain;
}

/* Prevent body scroll when modal open (iOS fix) */
body.modal-open {
  overflow: hidden;
  position: fixed;
  width: 100%;
}
```

### 2. MobileLayout Improvements

Update the main scroll container for better mobile behavior:

```tsx
<main 
  ref={containerRef}
  className="flex-1 overflow-y-auto pb-20 overscroll-contain mobile-scroll-optimized"
  style={{ 
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'max(80px, calc(64px + env(safe-area-inset-bottom)))'
  }}
>
```

### 3. Sheet Component Touch Optimization

Add scroll optimization to SheetContent:

```tsx
const SheetContent = React.forwardRef<...>(
  ({ side = "right", className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(
          sheetVariants({ side }), 
          // Add mobile scroll optimization
          "overflow-y-auto overscroll-contain",
          className
        )}
        style={{ WebkitOverflowScrolling: 'touch' }}
        {...props}
      >
```

### 4. Dialog Mobile Optimization

Update DialogContent for mobile scrolling:

```tsx
<DialogPrimitive.Content
  ref={ref}
  className={cn(
    "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ...",
    // Add mobile optimization
    "max-h-[90vh] overflow-y-auto overscroll-contain",
    className
  )}
  style={{ WebkitOverflowScrolling: 'touch' }}
  {...props}
>
```

### 5. QuickAddSheet Safe Area Fix

Update height calculation to respect safe areas:

```tsx
<SheetContent 
  side="bottom" 
  className="h-[85vh] rounded-t-2xl flex flex-col"
  style={{ 
    maxHeight: 'calc(85vh - env(safe-area-inset-bottom))',
    paddingBottom: 'env(safe-area-inset-bottom)'
  }}
>
  {/* ... */}
  <div 
    className="mt-4 overflow-y-auto flex-1 overscroll-contain"
    style={{ WebkitOverflowScrolling: 'touch' }}
  >
```

### 6. Page Layout Fixes

For each page, remove `min-h-screen` which conflicts with MobileLayout:

**Before:**
```tsx
<div className="min-h-screen bg-background">
```

**After:**
```tsx
<div className="bg-background">
```

The MobileLayout already handles the full-screen layout, so pages shouldn't enforce their own height.

---

## Testing Checklist

After implementation, verify on both iOS and Android:

1. **Dashboard scroll** - Smooth up/down scrolling, no stutter
2. **Pull-to-refresh** - Works at top of page, doesn't interfere with normal scroll
3. **Quick Add sheet** - Opens smoothly, form content scrollable, submit button visible
4. **Route Editor dialog** - Can scroll to see all fields including Run Schedule
5. **Bottom nav sheets** - "More" menu scrolls smoothly if needed
6. **Long pages** - Inventory, Revenue, Locations all scroll properly
7. **Form inputs** - Keyboard doesn't break scroll position
8. **Select dropdowns** - Work correctly within sheets/dialogs

---

## Why These Fixes Work

1. **`overscroll-behavior-y: contain`** - Prevents scroll chaining between nested scroll containers
2. **`-webkit-overflow-scrolling: touch`** - Enables iOS momentum scrolling for native feel
3. **Safe area handling** - Ensures content isn't hidden behind iPhone notch/home bar
4. **Removing `min-h-screen`** - Prevents pages from creating their own scroll context when already in MobileLayout
5. **Touch action** - Explicitly tells browser how to handle touch gestures

---

## Technical Notes

- iOS Safari requires explicit `-webkit-overflow-scrolling: touch` for smooth scrolling in scroll containers
- Android Chrome handles momentum scrolling natively but benefits from `overscroll-behavior`
- The combination of `overscroll-contain` on the main container and `overscroll-behavior-y: none` on body prevents double-bounce effects
- Safe area CSS functions (`env(safe-area-inset-*)`) work on all modern iOS/Android browsers

