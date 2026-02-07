

## Fix Android Scrolling Issue

### Problem Summary

The app is not scrolling on Android devices. After analyzing the codebase, I found several CSS issues that prevent scrolling specifically on Android browsers.

---

### Root Causes Identified

| Issue | Location | Impact |
|-------|----------|--------|
| **`overscroll-behavior-y: none`** on html/body | `src/index.css` line 136 | Prevents native scroll behavior on some Android browsers |
| **`touch-action: pan-y`** in scroll container | `src/index.css` line 292 | Combined with flex layout, can cause scroll lock on Android |
| **Missing explicit height** on main container | `MobileLayout.tsx` line 25-30 | Flex child with `overflow-y-auto` needs explicit height for Android |
| **Conflicting `min-h-screen` calculations** | `MobileLayout.tsx` line 18-21 | The CSS calc with safe areas can cause issues on Android Chrome |

---

### Solution

**1. Fix the Global CSS (index.css)**

Remove the aggressive `overscroll-behavior-y: none` from html/body and make the mobile scroll optimizations Android-compatible:

```css
/* Before */
html, body {
  overscroll-behavior-y: none;
}

/* After */
html {
  overflow-x: hidden;
}

body {
  overflow-y: auto;
  overflow-x: hidden;
}
```

**2. Fix Mobile Layout (MobileLayout.tsx)**

The main scrollable area needs an explicit height calculation that works on Android:

```tsx
// Before
<main 
  className="flex-1 overflow-y-auto overscroll-contain mobile-scroll-optimized"
  style={{ 
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'max(80px, calc(64px + env(safe-area-inset-bottom)))'
  }}
>

// After
<main 
  className="flex-1 overflow-y-auto overflow-x-hidden"
  style={{ 
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'max(80px, calc(64px + env(safe-area-inset-bottom)))',
    minHeight: 0, /* Critical for flex child scrolling */
  }}
>
```

**3. Update Mobile Scroll Optimization Class (index.css)**

Make the scroll class Android-compatible:

```css
/* Before */
.mobile-scroll-optimized {
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: contain;
}

/* After */
.mobile-scroll-optimized {
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y pinch-zoom;
  overscroll-behavior-y: auto;
}
```

**4. Fix Container Height Calculation (MobileLayout.tsx)**

The parent container needs proper flex behavior:

```tsx
// Before
<div 
  className="min-h-screen bg-background flex flex-col"
  style={{
    minHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
  }}
>

// After
<div 
  className="h-screen bg-background flex flex-col overflow-hidden"
  style={{
    height: '100dvh', /* Dynamic viewport height - better for mobile */
  }}
>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Remove restrictive overscroll-behavior, update mobile scroll class |
| `src/components/layout/MobileLayout.tsx` | Fix container heights and scroll handling for Android |

---

### Technical Explanation

**Why Android Fails When iOS Works:**

1. **Dynamic Viewport Height**: iOS Safari handles `100vh` differently than Android Chrome. The new `100dvh` unit is more reliable across both platforms.

2. **Flex Overflow**: When a flex child has `overflow-y: auto`, it needs either:
   - An explicit height, OR
   - `min-height: 0` to allow it to shrink below its content size

3. **Touch Action**: `touch-action: pan-y` alone can conflict with Android's gesture navigation. Adding `pinch-zoom` helps.

4. **Overscroll Behavior**: Setting `overscroll-behavior-y: none` on the body prevents the default scroll container behavior on some Android browsers.

---

### Changes Summary

```text
src/index.css
├── Remove overscroll-behavior-y: none from html, body
├── Keep overscroll-behavior-y on specific scroll containers only
└── Update .mobile-scroll-optimized class

src/components/layout/MobileLayout.tsx
├── Change min-h-screen to h-screen with overflow-hidden
├── Use 100dvh for better mobile support
├── Add min-height: 0 to main element
└── Remove conflicting safe-area calculation on container
```

---

### Expected Result

After these changes:
- Scrolling will work on both Android and iOS
- Pull-to-refresh gestures will be handled correctly
- Safe area insets will still be respected for notched devices
- The bottom navigation will remain fixed and accessible

