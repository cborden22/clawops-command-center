

## Fix: Location Detail Dialog Scroll with Photos

The `ScrollArea` at line 635 uses `flex-1` to fill remaining space, but Radix ScrollArea's internal viewport doesn't respect flex sizing properly -- it needs a concrete height constraint to enable scrolling.

### Fix

**File: `src/components/LocationDetailDialog.tsx`** (line 635)

Replace the `ScrollArea` with a plain `div` that uses `flex-1 min-h-0 overflow-y-auto`. This is the same pattern documented in the project's dialog-layout-stacking memory and works reliably with flex containers:

```tsx
// Before
<ScrollArea className="flex-1 mt-4">

// After
<div className="flex-1 min-h-0 overflow-y-auto mt-4 pr-1">
```

And close the corresponding tag at the end. Single line change, proven pattern for this codebase.

