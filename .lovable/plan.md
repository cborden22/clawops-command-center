## Polish Pass — all four candidates

### 1. Skeleton loading states
Reuse the existing `SkeletonGrid` / `SkeletonList` / `SkeletonWidget` primitives (already built, currently only used on the Dashboard).

- **Revenue** (`RevenueTrackerComponent.tsx`): show `SkeletonGrid` for the stat cards and `SkeletonList` for the entry list while revenue data loads, instead of rendering an empty shell.
- **Inventory** (`InventoryTrackerComponent.tsx`): skeleton stat row + skeleton table/list rows during initial fetch.
- **Locations** (`LocationTrackerComponent.tsx`): skeleton cards matching the location card grid.
- Only show skeletons on *initial* load, not on background refetches, so the screen doesn't flash on manual refresh.

### 2. Empty-state audit
`EmptyState` exists but is only used in Inventory, Locations and Leads. Audit and apply consistently, each with an icon, one-line explanation and a primary CTA:
- Revenue entries, Mileage entries/routes, Calendar agenda, Maintenance reports, Reports (no data in range), Team members, Receipts.
- Distinguish "nothing yet" (CTA to create) from "no results for this filter" (CTA to clear filters) — add a `variant` or optional `onClear` action to `EmptyState`.

### 3. Contextual help tooltips
Extend usage of the existing `HelpTooltip` to genuinely ambiguous fields only:
- Revenue: commission rate, revenue split, accrual/last collection date, bag label.
- Inventory: reorder threshold, package equivalence, cost vs. price, SKU.
- Machines: win probability, cost per play.
- Mileage: odometer-based tracking note, IRS rate.
- Team: what each predefined role can do.

### 4. Mobile command palette
- Full-height sheet-style presentation on small screens instead of a centered desktop dialog.
- Larger touch targets (min 44px rows), bigger input, keyboard-safe padding.
- Hide desktop-only hints (`⌘K`, arrow-key legend) on mobile; show a "Cancel" affordance.
- Debounce record search and cap results per group so the list stays scannable on a phone.
- Keep body-scroll locked and ensure the palette clears the mobile bottom nav.

### Technical notes
- No new dependencies; all components already exist (`SkeletonGrid`, `EmptyState`, `HelpTooltip`, `cmdk`).
- Presentation-layer only — no data-fetch, RLS, or business-logic changes.
- Verify with a typecheck plus Playwright screenshots at mobile (390px) and desktop widths.
