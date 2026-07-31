## Goal

Give ClawOps one consistent, professional look (Navy Trust palette, Inter type) and make the app easier to navigate — fewer clicks to the things people use daily, less clutter on the dense pages.

Note on existing memory: project memory records a "dark charcoal + gold" identity, but the live CSS is a light blue theme and the sidebar still uses `gold-*` classes mapped to blue variables. This plan replaces both with Navy Trust and updates that memory entry so the mismatch stops recurring.

---

## Act 1 — Design system foundation

**`src/index.css` + `tailwind.config.ts`**

- Rewrite `:root` and `.dark` tokens to Navy Trust:
  - Light: background `#E8EDF3`-tinted off-white, foreground deep navy `#0F1B3D`, primary `#1E3A5F`, accent/interactive `#3B6FA0`, cards near-white with navy-tinted borders.
  - Dark: background `#0F1B3D`, surfaces `#1E3A5F`, primary `#3B6FA0`, foreground `#E8EDF3`.
  - All values in HSL, as required.
- Add semantic status tokens (`--success`, `--warning`, `--info`, plus `-foreground` and `/10` surface variants) so components stop reaching for `text-green-600`, `bg-yellow-500/10`, etc.
- Replace the `gold` and `blue` numeric scales in Tailwind config with a single `brand` scale plus the new status colors; keep `gold`/`blue` as deprecated aliases for one pass so nothing breaks mid-migration, then remove them at the end.
- Refresh `--gradient-*` and `--shadow-*` for navy; tone down the current heavy glow/scale hover effects to a subtle, professional lift.
- Keep Inter.

**Color cleanup pass** — 50 files currently use hardcoded color utilities. Migrate them to tokens, worst offenders first: `AppSidebar` (18), `Dashboard` (15), `Calendar` (12), `DataManagement` (12), `InventoryTrackerComponent` (12), `ResearchTracker` (11), `Maintenance` (10), `ReportCard` (9), `RevenueTrackerComponent` (9), then the tail.

---

## Act 2 — Navigation rework

**Desktop sidebar (`AppSidebar.tsx`)**
- Drop the three collapsible groups. Daily-use items become a flat primary list: Dashboard, Locations, Revenue, Inventory, Routes, Leads, Maintenance.
- Secondary items (Reports, Calendar, Team, Receipts) move to a lighter "Insights & Admin" section below a divider — visible, not nested behind a toggle.
- Simplify the nav item chrome: remove the per-item icon tile, gradient pill, and scale-on-hover. Active state = navy surface + left accent bar + accent-colored icon.
- Keep the existing permission filtering exactly as-is.

**Header (`AppLayout.tsx`)**
- Replace the decorative "Professional Tools" / "System Online" chrome with a real page title (derived from route) and a right-side action area (quick add + user menu).
- Remove the three floating blurred background blobs — they cost paint and add nothing.

**Mobile (`MobileBottomNav.tsx`, `MobileHeader.tsx`)**
- Keep 5 tabs: Home, Locations, Add, Revenue, More.
- Rebuild the More sheet as a clean labeled grid (Operations / Financials / Account) with 44px+ targets, replacing the current mixed layout.
- Bottom nav gets a solid token surface + top border instead of glass, so content never bleeds through.

---

## Act 3 — Priority screens

**Dashboard + Reports**
- Standardize every stat card on one shared `StatCard` component (responsive `text-xl sm:text-2xl lg:text-3xl`, `min-w-0`, `truncate`, `tabular-nums`) so numbers stop bunching. Applies to Dashboard's four cards and the report tabs.
- Unify `ReportCard` and the dashboard widgets to the same card padding, header, and border treatment.
- Reports page: keep tabs, but make the tab strip scroll cleanly on mobile and add a persistent date-range summary line so users know what they're looking at.

**Revenue + Inventory** (1,500-line components each)
- Not a rewrite. Extract the presentational pieces only: stat header, filter bar, list row/table row, and empty state into small components in `src/components/revenue/` and `src/components/inventory/`.
- Standardize the filter bar to the same pattern used on Leads: full-width search on top, selects side-by-side below on mobile.
- Consistent empty states (icon + one-line explanation + primary action) instead of bare text.

**Locations + Leads**
- Locations: unify the 5-tab strip styling with Reports; tighten the tab content padding so mobile doesn't double-pad.
- Leads: keep the existing tabbed-stage behavior under 1024px; align the pipeline card styling with the new tokens and fix remaining `min-w-0` gaps.

**Mobile overall**
- Audit sheets/dialogs for the `.mobile-sheet-scroll` + `flex-1 min-h-0 overflow-y-auto` pattern already documented in memory.
- Verify 44px targets and the `bottom-20` floating-UI offset survive the restyle.

---

## Act 4 — Verification

- Playwright screenshots at 390px, 820px, and 1440px for Dashboard, Locations, Revenue, Inventory, Leads, Reports, Calendar, Settings — before/after comparison.
- Grep to confirm zero remaining hardcoded color utilities outside `src/components/ui/`.
- Accessibility sweep on the touched files: `aria-label` on icon-only buttons, single `<main>`, contrast against the new tokens.
- Typecheck + build.

---

## Technical notes

- Purely presentational. No schema, RLS, edge function, or business-logic changes.
- The `gold` → `brand` alias shim keeps the app rendering during migration and is removed in the final step.
- Existing behavioral patterns from project memory are preserved: Leaflet-direct maps, dialog `onOpenChange(false)` before async delete, Radix input `stopPropagation`, numeric-input select-on-focus, jspdf PDF generation.
- Memory update at the end: replace the "Dark #0F0F10 + gold" core rule with the Navy Trust identity.

## Sequencing

Tokens and config first (everything depends on them), then navigation, then the color-cleanup pass file by file, then the four priority screen groups, then verification. Each stage builds cleanly on its own.
