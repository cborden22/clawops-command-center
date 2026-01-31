

## Fix Mobile Scrolling Issues in Stock and Inventory Sections

### Problem Analysis

After investigating the codebase, I found **three compounding issues** causing glitchy mobile scrolling:

#### Issue 1: Nested Scrollable Containers
The scroll hierarchy creates conflicts:
```
MobileLayout <main> (overflow-y-auto, pb-20)
  └─ InventoryTracker page (min-h-screen, py-8)
      └─ container with py-8 px-4
          └─ InventoryTrackerComponent (pb-24)
```

The page has `min-h-screen` which can create a nested scrolling context inside the already-scrollable `<main>` container.

#### Issue 2: Pull-to-Refresh Interference
The `usePullToRefresh` hook uses `{ passive: false }` on `touchmove` events (line 94) which allows `preventDefault()` to block native scrolling. This can cause:
- Jank when the scroll position is near the top
- Conflict between pull-to-refresh gesture and normal scrolling
- The hook activates when `scrollTop <= 0`, which can be triggered prematurely

#### Issue 3: Page Container Styles
The `InventoryTracker` page uses desktop-oriented styling (`py-8`, `min-h-screen`) that doesn't adapt well to the mobile scroll container structure.

---

### Solution

#### 1. Fix Page Container Styling (`src/pages/InventoryTracker.tsx`)

Remove the conflicting `min-h-screen` and reduce padding on mobile to work within the MobileLayout's scroll container:

| Current | Fixed |
|---------|-------|
| `min-h-screen bg-background` | Remove `min-h-screen` |
| `py-8 px-4` | Use responsive padding |
| `mb-8` on header | Reduce on mobile |

The page content should flow naturally within the MobileLayout's scrollable `<main>` without creating its own scroll context.

#### 2. Optimize Pull-to-Refresh (`src/hooks/usePullToRefresh.ts`)

The current implementation can interfere with scrolling. Improvements:

- **Add scroll position guard**: Only activate pull-to-refresh when scroll is truly at 0, not just `<= 0`
- **Add velocity check**: Don't activate if user is scrolling down quickly
- **Reset isPulling more aggressively**: If user starts scrolling down, cancel the pull gesture

#### 3. Add Mobile-Optimized Scroll Container (`src/components/layout/MobileLayout.tsx`)

Apply the `mobile-scroll-optimized` utility class that was added in the previous fix to ensure smooth iOS/Android scrolling behavior.

#### 4. Reduce Bottom Padding Overlap

The component has `pb-24` and the page has padding, plus MobileLayout has `pb-20`. This creates excessive padding. Streamline the padding hierarchy.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/InventoryTracker.tsx` | Remove `min-h-screen`, use responsive padding that works on mobile |
| `src/hooks/usePullToRefresh.ts` | Improve scroll position detection, add downward scroll cancellation |
| `src/components/layout/MobileLayout.tsx` | Add `mobile-scroll-optimized` class to main container |
| `src/components/InventoryTrackerComponent.tsx` | Adjust bottom padding for mobile context |

---

### Technical Details

**InventoryTracker.tsx Changes**

```tsx
// Before
<div className="min-h-screen bg-background">
  <div className="container mx-auto py-8 px-4">
    <div className="mb-8">

// After - Mobile-friendly structure
<div className="bg-background">
  <div className="container mx-auto py-4 sm:py-8 px-4">
    <div className="mb-4 sm:mb-8">
```

**usePullToRefresh.ts Changes**

Key improvements to prevent scroll interference:
```typescript
const handleTouchStart = useCallback((e: TouchEvent) => {
  if (!containerRef.current || isRefreshing) return;
  
  // More strict check - only activate if exactly at top
  const scrollTop = containerRef.current.scrollTop;
  if (scrollTop === 0) {
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
    hasTriggeredHaptic.current = false;
  }
}, [isRefreshing]);

const handleTouchMove = useCallback((e: TouchEvent) => {
  if (!isPulling || isRefreshing) return;
  
  // Check if scroll position has changed (user scrolled down)
  if (containerRef.current && containerRef.current.scrollTop > 0) {
    // Cancel pull gesture if user is scrolling the content
    setIsPulling(false);
    setPullDistance(0);
    return;
  }
  
  currentY.current = e.touches[0].clientY;
  const diff = currentY.current - startY.current;
  
  // Only process if pulling DOWN (positive diff)
  // If pulling up (negative diff), cancel the gesture
  if (diff < 0) {
    setIsPulling(false);
    setPullDistance(0);
    return;
  }
  
  // ... rest of existing logic
}, [...]);
```

**MobileLayout.tsx Changes**

Add the scroll optimization class:
```tsx
// Before
<main 
  ref={containerRef}
  className="flex-1 overflow-y-auto pb-20 overscroll-contain"
>

// After
<main 
  ref={containerRef}
  className="flex-1 overflow-y-auto pb-20 overscroll-contain mobile-scroll-optimized"
>
```

**InventoryTrackerComponent.tsx Changes**

Reduce redundant bottom padding since MobileLayout already adds pb-20:
```tsx
// Before
<div className="space-y-4 animate-fade-in pb-24">

// After - Let parent handle bottom padding
<div className="space-y-4 animate-fade-in pb-4">
```

---

### Visual Result

**Before (Glitchy):**
- Pull-to-refresh triggers accidentally when trying to scroll up
- Scrolling feels "stuck" or jumpy near the top of the page
- Excessive white space at the bottom

**After (Smooth):**
- Pull-to-refresh only activates when truly at the top AND pulling down
- Scrolling is smooth with native-feeling momentum
- Consistent spacing that works with the bottom navigation

---

### Edge Cases Handled

- **Fast scrolling**: Cancels pull gesture if user quickly scrolls down
- **Bounce-back**: Prevents accidental pull-to-refresh during iOS elastic scroll bounce
- **Desktop**: No changes to desktop behavior (hooks check `isMobile`)
- **All mobile pages**: The MobileLayout fix applies to all pages using the mobile layout

