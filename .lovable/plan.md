

## Fix: Service Period Spread Not Working Reliably

### Root Cause

There are **two bugs** causing the "spread across service period" feature to fail:

1. **Quick Collection never updates `last_collection_date`**: When you submit income via `QuickRevenueForm`, the location's `last_collection_date` is never updated. Only route run stops update it (in `useRouteRun.ts` line 235-238). So the next time you collect at that location, the spread period is wrong or missing.

2. **Stale cached data in QuickRevenueForm**: The form reads `lastCollectionDate` from the `useLocations()` hook's cached state, which was fetched once at page load. Even if `last_collection_date` exists in the DB, the cached data may be stale.

### Fix Plan

**File: `src/components/mobile/QuickRevenueForm.tsx`**
- After successfully adding an income entry for a location, update the location's `last_collection_date` in the database (same as route run does)
- This ensures the next collection at that location will have a valid service period start date

**File: `src/components/mileage/RouteRunStopView.tsx`**
- Add a fallback: if `last_collection_date` is null on the location, query `revenue_entries` for the most recent income entry at that location to use as the service period start
- This handles locations where collections were recorded before `last_collection_date` tracking was added

**File: `src/components/mobile/QuickRevenueForm.tsx`** (additional)
- Same fallback: if `selectedLocationLastCollection` is null, query `revenue_entries` for the latest income entry at that location when the location is selected
- This fixes the "No previous collection" message even when prior collections exist

### Summary of Changes

| File | Change |
|---|---|
| `QuickRevenueForm.tsx` | Update `last_collection_date` on location after income submit; add fallback query to `revenue_entries` when no `last_collection_date` exists |
| `RouteRunStopView.tsx` | Add fallback query to `revenue_entries` when `last_collection_date` is null on the location |

This is a focused 2-file fix that addresses both the write-side gap (not saving the date) and the read-side gap (not falling back to actual revenue history).

