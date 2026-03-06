

## Fix: Mobile Scrolling in Sheets/Menus

### Problem
Bottom sheets (More menu, Quick Add, Documents) get stuck or don't scroll properly on mobile. This is caused by conflicting scroll behaviors between the sheet overlay, the sheet content, and the inner scrollable areas.

### Root Causes
1. **Sheet component has `overflow-y-auto` on the content wrapper** (line 64 of sheet.tsx) which competes with inner scroll containers
2. **QuickAddSheet has nested scroll containers** — the SheetContent scrolls AND the inner `div` with `overflow-y-auto` scrolls, causing touch event conflicts
3. **More menu sheet doesn't have explicit scroll handling** — when content overflows (many menu items), there's no proper scroll container
4. **`touch-action` and `overscroll-behavior` conflicts** — the CSS classes `sheet-scroll-content` and the sheet's own scroll settings fight each other

### Fix Strategy

**1. Sheet component (`src/components/ui/sheet.tsx`)**
- Remove `overflow-y-auto overscroll-contain` from the SheetContent base classes for `bottom` side sheets
- Let individual sheet consumers control their own scrolling
- Add `touch-action: manipulation` to prevent double-tap zoom delays

**2. QuickAddSheet (`src/components/mobile/QuickAddSheet.tsx`)**
- Make SheetContent use `overflow-hidden` (no scroll on outer container)
- Keep the single inner scroll div with proper `overflow-y-auto`, `overscroll-behavior-y: contain`, and `-webkit-overflow-scrolling: touch`
- Add `pb-6` padding at bottom of scroll area for safe area clearance

**3. MobileBottomNav More menu (`src/components/layout/MobileBottomNav.tsx`)**
- Wrap the More menu sheet content in a scrollable container with `max-h-[70vh] overflow-y-auto`
- Add `overscroll-behavior-y: contain` to prevent scroll chaining to the body

**4. DocumentsSheet (`src/components/mobile/DocumentsSheet.tsx`)**
- Minor: ensure consistent scroll handling pattern

**5. Global CSS (`src/index.css`)**
- Add a utility class `.mobile-sheet-scroll` that combines the correct touch/scroll properties for use in all bottom sheets

### Files to Change
- `src/components/ui/sheet.tsx` — conditional overflow for bottom sheets
- `src/components/mobile/QuickAddSheet.tsx` — fix nested scroll
- `src/components/layout/MobileBottomNav.tsx` — add scroll wrapper to More menu
- `src/index.css` — add `.mobile-sheet-scroll` utility

