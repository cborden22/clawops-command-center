

## Fix Export CSV Dropdown Freezing with Scroll Support

### Problem
The Export CSV dropdown menu contains 18+ items across 6 categories, making it very tall. When opened, it can:
- Extend beyond the viewport
- Block main thread while trying to render and position all items
- Cause the page to appear "frozen"

### Solution
Add a `ScrollArea` wrapper inside the dropdown with a constrained max-height, enabling smooth scrolling through the export options.

---

### Technical Changes

#### File: `src/components/reports/DateRangeFilter.tsx`

1. **Import ScrollArea**: Add import for the scroll area component
2. **Wrap dropdown content in ScrollArea**: Add scrolling with max-height constraint
3. **Adjust styling**: Ensure proper overflow handling

---

### Implementation Details

**Before:**
```tsx
<DropdownMenuContent align="end" className="w-56 bg-popover">
  <DropdownMenuLabel>Locations</DropdownMenuLabel>
  <DropdownMenuItem>...</DropdownMenuItem>
  <!-- 18+ items without scroll -->
</DropdownMenuContent>
```

**After:**
```tsx
<DropdownMenuContent align="end" className="w-56 bg-popover p-0">
  <ScrollArea className="h-[400px]">
    <div className="p-1">
      <DropdownMenuLabel>Locations</DropdownMenuLabel>
      <DropdownMenuItem>...</DropdownMenuItem>
      <!-- All items now scrollable -->
    </div>
  </ScrollArea>
</DropdownMenuContent>
```

---

### Key Changes

| Change | Purpose |
|--------|---------|
| Add `ScrollArea` import | Enable smooth scrolling component |
| Wrap menu content in `ScrollArea` with `h-[400px]` | Constrain height to ~400px, fitting most screens |
| Move padding from `DropdownMenuContent` to inner `div` | Ensure proper scroll behavior |
| Keep `p-0` on `DropdownMenuContent` | Prevent double padding |

---

### Why 400px Max Height?

- Tall enough to show ~12-15 items at once (good context)
- Short enough to fit on most screens including mobile
- Provides clear visual indication that scrolling is available
- Prevents the dropdown from pushing content off-screen

---

### Mobile Optimization

The `ScrollArea` component uses Radix's scroll primitives which:
- Work smoothly with touch scrolling
- Show subtle scrollbar on hover/scroll
- Support momentum scrolling on iOS
- Prevent scroll chaining to parent page

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/reports/DateRangeFilter.tsx` | Add ScrollArea wrapper with max-height around dropdown menu items |

