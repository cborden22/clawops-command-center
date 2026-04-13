

## Fix Dashboard Stat Cards Text Overflow on Tablet/Mobile

### Problem
At 768px (tablet with sidebar open, effective width ~500px), the 4 stat cards render in a 2-column grid. The large dollar amounts (e.g., `$12,345`) at `text-2xl` combined with the icon and padding cause text to bunch up and overflow the card boundaries.

### Solution
Apply `min-w-0` and `truncate` to the text containers, and scale down the font sizes at constrained widths so numbers always fit cleanly inside their cards.

### Changes — `src/pages/Dashboard.tsx`

For each of the 4 stat cards (Active Locations, Month Income, Net Profit, Inventory):

1. **Add `min-w-0` to the text wrapper `<div>`** (the one containing label, value, subtitle) so it can shrink below its content size inside the flex row.

2. **Scale down the value font size**: Change `text-2xl sm:text-3xl` → `text-xl sm:text-2xl lg:text-3xl` so numbers are smaller on tablet-width screens.

3. **Add `truncate` to the value `<p>`** as a safety net so very large numbers (e.g., `$1,234,567`) clip with an ellipsis rather than overflowing.

4. **Reduce icon container gap**: The `gap-3 sm:gap-4` on the flex row is fine, but the icon padding `p-2 sm:p-3` could be tightened — no change needed if the font scaling fixes the fit.

This is a targeted CSS-only fix across the 4 card blocks in `renderPrimaryStats()` (lines ~337–438). No logic changes.

