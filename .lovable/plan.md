

## Fix Route Editor Layout - Select Dropdowns Appearing Behind Schedule Section

The issue is that when creating/editing a route, the dropdown menus in the Stops section appear behind the "Run Schedule" section below. This is caused by CSS stacking context and overflow issues.

---

## Root Cause

The `RouteEditor.tsx` component has these conflicting styles:
1. `DialogContent` has `overflow-visible` (line 188)
2. Stops container has `overflow-y-auto` (line 239)
3. The Run Schedule section sits below the stops area

When you open a Select dropdown inside the scrollable stops area, the dropdown portal renders correctly, but the visual stacking order gets confused due to the mixed overflow contexts.

---

## Solution

Make these CSS adjustments to fix the z-index stacking:

### Change 1: Remove `overflow-visible` from DialogContent

The `overflow-visible` on the DialogContent isn't needed and causes issues. We'll remove it and let the dialog handle overflow properly.

**File: `src/components/mileage/RouteEditor.tsx`**

```diff
- <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-visible">
+ <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
```

### Change 2: Ensure proper z-index on Select dropdowns

The SelectContent in RouteStopItem already has `z-50`, which should be sufficient. However, we should also ensure the parent sections have proper stacking.

**File: `src/components/mileage/RouteEditor.tsx`**

Add `relative z-10` to the stops scrollable container to create a new stacking context, and ensure the Run Schedule section has lower stacking priority:

```diff
- <div className="max-h-[280px] overflow-y-auto pr-1 space-y-0">
+ <div className="relative z-10 max-h-[280px] overflow-y-auto pr-1 space-y-0">
```

### Change 3: Add z-index to Run Schedule section

Ensure the Run Schedule section doesn't overlap dropdown menus:

```diff
- <div className="space-y-3">
+ <div className="relative z-0 space-y-3">
```

---

## File Changes Summary

| File | Line | Change |
|------|------|--------|
| `src/components/mileage/RouteEditor.tsx` | 188 | Change `overflow-visible` to `overflow-hidden` |
| `src/components/mileage/RouteEditor.tsx` | 239 | Add `relative z-10` to stops container |
| `src/components/mileage/RouteEditor.tsx` | 260 | Add `relative z-0` to Run Schedule section |

---

## Why This Works

1. **`overflow-hidden`** on DialogContent prevents content from visually escaping the dialog bounds while still allowing portaled elements (like Select dropdowns) to render correctly
2. **`z-10`** on the stops container ensures dropdown menus from within it stack above other content
3. **`z-0`** on the Run Schedule section explicitly places it below the stops' dropdowns in the stacking order

The Select component's dropdown uses Radix UI's Portal, which renders the dropdown at the document body level. By properly managing stacking contexts in the parent elements, the dropdowns will always appear on top.

