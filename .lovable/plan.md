## Goal
Give new users a short, self-completing checklist on the Dashboard that walks them through their first location, first lead, and first inventory entry.

## Behavior
- Card appears at the top of the Dashboard (above all other widgets) only while at least one step is incomplete.
- Three steps, each with a title, one-line description, and a button that navigates to the relevant page:
  1. Add your first location — `/locations`
  2. Add your first lead — `/leads`
  3. Add your first inventory item — `/inventory`
- Completion is derived from live data (locations count > 0, leads count > 0, inventory items count > 0) — no new database tables, nothing to mark manually. Steps auto-check as data appears.
- Progress indicator ("1 of 3 complete") with a slim progress bar.
- A "Dismiss" control hides the card permanently for that browser (localStorage key), matching the app's existing settings-in-localStorage approach.
- When all three are done, the card shows a brief "You're all set" state and then stops rendering on subsequent loads.
- Steps the user lacks permission for (e.g. no `canViewLeads` / `canViewInventory` / `canViewLocations`) are omitted from the checklist and from the progress count.

## Technical details
- New component `src/components/dashboard/OnboardingChecklist.tsx`.
  - Reads existing hooks: `useLocations`, `useLeadsDB`, `useInventory`, plus `useMyTeamPermissions` for gating.
  - Waits for the hooks' loaded flags before rendering to avoid a flash of an empty checklist for existing users.
  - Uses Navy Trust design tokens only (no hardcoded colors), `Card`, `Button`, and lucide `CheckCircle2` / `Circle` icons; mobile-friendly with 44px touch targets.
- `src/pages/Dashboard.tsx`: render `<OnboardingChecklist />` above the widget grid. It is intentionally not part of the customizable widget list, since it disappears once onboarding completes.
- Dismissal persisted under `clawops_onboarding_dismissed` in localStorage.
