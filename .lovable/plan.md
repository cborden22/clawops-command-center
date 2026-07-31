# Polished SaaS Experience Plan

## Goal
Make ClawOps feel like a cohesive, premium SaaS product by adding the navigation, feedback, and performance polish users expect from modern software — without rebuilding core workflows.

## Phase 1: Instant Navigation & Discovery

### 1.1 Global Command Palette (Cmd+K)
- Wire the existing `cmdk` dependency into a new `CommandPalette` component.
- Trigger with `Cmd/Ctrl + K` and a persistent search button in the desktop header / mobile header.
- Provide three groups:
  - **Jump to**: Dashboard, Revenue, Locations, Inventory, Leads, Maintenance, Routes, Reports, Settings.
  - **Quick actions**: Add location, Add lead, Add inventory, Add revenue entry, Generate recurring revenue, Create route.
  - **Recent**: Last 5 visited routes (persisted in `localStorage`).
- Respect team permissions so users only see items they can access.

### 1.2 Breadcrumbs & Consistent Page Chrome
- Add a `PageHeader` shared component used by every top-level page.
- Shows: title, short description, optional back button, and primary action button(s).
- Replace the one-off `h1` + `p` blocks in Revenue, Inventory, Locations, Leads, etc. with this component.
- Keeps mobile headers from feeling like separate mini-apps.

### 1.3 Global Search for Records
- Extend the command palette with a "Search records" mode.
- Search across locations, leads, and inventory items by name.
- Selecting a result navigates directly to the record (location detail, lead detail, etc.).
- Debounce input and cap results at ~8 items for speed.

## Phase 2: Perceived Performance

### 2.1 Skeleton Screens for Dashboard
- Replace the current full-page "waiting for all hooks" spinner with per-widget skeletons.
- Each dashboard widget shows its own `Skeleton` layout so the page feels alive while data streams in.
- Apply the same pattern to the primary stats row and the weekly calendar widget first.

### 2.2 Page-Level Skeleton States
- Add skeleton layouts for Revenue, Inventory, Locations, and Leads list views.
- Use the existing `Skeleton` primitive plus `Card` placeholders.
- Avoid the jarring empty → loaded flash on slower connections.

### 2.3 Optimistic Action Feedback
- For quick actions (dismissing checklist, toggling settings, deleting a row), update the UI immediately and roll back only on error.
- Keeps the interface feeling snappy.

## Phase 3: Contextual Guidance

### 3.1 Empty-State Upgrades
- Audit every list view to ensure it uses the shared `EmptyState` component.
- Add contextual illustrations/icons and a primary CTA that matches the page (e.g., "Add your first location").
- Add a secondary hint text explaining why the feature matters.

### 3.2 Help Tooltips
- Use the existing `Tooltip` component to explain confusing fields:
  - Commission rate, low-stock threshold, default currency in Settings.
  - Win probability, cost per play in machine forms.
  - Recurring frequency options in Revenue.
- Keep tooltips short (one sentence) and consistent in tone.

### 3.3 Feature Highlights for New Users
- After the onboarding checklist is complete, show one-time "Did you know?" cards for advanced features:
  - QR code maintenance reports.
  - Recurring revenue.
  - Team permissions.
- Dismissible and stored in `localStorage`.

## Phase 4: Power-User Conveniences

### 4.1 Keyboard Shortcuts Sheet
- Add a `?` shortcut that opens a keyboard shortcuts dialog.
- Document: `Cmd+K` command palette, `?` help, `n` new record (context-aware), `/` focus search.
- Show shortcut hints in desktop tooltips and the command palette footer.

### 4.2 Recent Items & Pinned Actions
- Persist last 5 visited locations/leads in `localStorage`.
- Surface them on the Dashboard in a small "Jump back in" widget.
- Add "Pin" capability to the command palette for favorite actions.

### 4.3 Sticky Mobile Action Bars
- Convert floating "Add" buttons on list pages into a sticky bottom action bar on mobile.
- Ensures the primary CTA is always reachable without scrolling.

## Phase 5: Visual & Motion Polish

### 5.1 Consistent Hover & Focus States
- Audit buttons, cards, and list rows for consistent `hover:bg-accent/10`, `focus-visible:ring-2 ring-ring` behavior.
- Add subtle lift shadows to stat cards and report cards on hover.

### 5.2 Page Transition
- Wrap route content in a lightweight fade/slide transition using the existing Tailwind `animate-fade-in` keyframe.
- Prevents abrupt content swaps when navigating.

### 5.3 Toast Improvements
- Convert generic success/error toasts into specific, actionable messages:
  - "Location saved" → "Sunset Arcade added. Add a machine?"
  - "Entry deleted" → "Revenue entry removed. Undo"
- Add an optional undo action where safe (e.g., deletions).

## Phase 6: Settings & Account Polish

### 6.1 Settings Sidebar Navigation (Desktop)
- Split the dense Settings tabs into a left sidebar with sections: App, Profile, Security, Subscription, Business, Integrations.
- Prevents the current tab overflow on narrow desktop widths.

### 6.2 Subscription Status Badge
- Show the current plan status (Trial · 5 days left, Pro, Complimentary) as a badge in the desktop sidebar footer and mobile "More" sheet.
- Makes billing state visible without opening Settings.

## Files Targeted
- `src/components/shared/PageHeader.tsx` (new)
- `src/components/shared/CommandPalette.tsx` (new)
- `src/components/shared/KeyboardShortcuts.tsx` (new)
- `src/components/shared/SkeletonGrid.tsx` (new)
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/MobileHeader.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/RevenueTracker.tsx`
- `src/pages/InventoryTracker.tsx`
- `src/pages/Locations.tsx`
- `src/pages/Leads.tsx`
- `src/pages/Settings.tsx`
- `src/components/settings/SubscriptionManager.tsx`

## Out of Scope (to keep this focused)
- New backend tables or schemas.
- New subscription tiers or pricing changes.
- New report types or analytics modules.
- Native mobile app features.

## Success Criteria
- A user can reach any major page in two keystrokes (`Cmd+K`, type, Enter).
- No page shows a blank or generic spinner while primary data loads.
- Every list view has a clear, actionable empty state.
- Settings no longer feels like a long form dump.
- Mobile navigation has a consistent sticky action pattern.