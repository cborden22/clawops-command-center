

## Revenue Accrual: Spread Collections Across Service Period

### Problem
When you collect $1,400 on March 4th but your last visit was Feb 20th (14 days ago), all $1,400 currently counts as March revenue. This distorts monthly reports — February looks underpaid, March looks inflated.

### Solution: Pro-Rata Revenue Spreading
Store a **service period** (start + end date) on each income entry. When viewing reports or filtering by date range, the system splits the revenue proportionally across the days in each month.

**Example:** $1,400 collected March 4th, last collection Feb 20th → 14-day service period
- Feb 20–28 = 9 days → $900 attributed to February
- Mar 1–4 = 5 days → $500 attributed to March

### Implementation

**1. Database: Add service period columns to `revenue_entries`**
```sql
ALTER TABLE revenue_entries 
  ADD COLUMN service_period_start date,
  ADD COLUMN service_period_end date;
```
No migration of existing data needed — entries without service period dates will behave as they do today (full amount on the entry date).

**2. Auto-populate service period on income entry creation**
In `RevenueTrackerComponent.tsx`, when logging an income entry for a location:
- Look up the location's `lastCollectionDate`
- Set `service_period_start` = last collection date (or entry date if none)
- Set `service_period_end` = entry date
- After saving, update the location's `last_collection_date` to the entry date

**3. Add a toggle: "Spread revenue across service period"**
In the income entry form, add a switch (default ON when a service period exists) so users can opt out for one-off entries like flat fees.

**4. Create a utility function for pro-rata splitting**
A new `src/utils/revenueAccrual.ts` file with:
```typescript
function spreadEntryAcrossDateRange(entry, queryStart, queryEnd): number
```
Given an entry with service_period_start/end and a query date range, returns the proportional amount that falls within that range. Entries without a service period return full amount if the entry date is in range, 0 otherwise.

**5. Update reporting hooks to use accrual**
- `useReportsData.ts` — the `filteredData.revenueEntries` income calculation uses the spread function instead of simple date filtering
- `useBusinessHealth.ts` — month-over-month calculations use spread amounts
- `RevenueTrackerComponent.tsx` — period summary totals use spread amounts
- The entry history table continues to show the full entry amount with the collection date (no change to raw data display)

**6. Update `useRevenueEntriesDB.ts`**
- Extend `RevenueEntry` interface with `servicePeriodStart?: Date` and `servicePeriodEnd?: Date`
- Map the new columns in fetch/add/update functions

### What stays the same
- The raw entry in the database is still one record with the full amount
- Entry history table shows the actual collection date and full amount
- CSV exports include service period columns for transparency
- Expenses are unaffected (no spreading)

### Files to change
- **Migration**: Add 2 columns to `revenue_entries`
- `src/utils/revenueAccrual.ts` — new file, spread logic
- `src/hooks/useRevenueEntriesDB.ts` — map new fields
- `src/components/RevenueTrackerComponent.tsx` — auto-set service period, add toggle, use spread in summaries
- `src/hooks/useReportsData.ts` — use spread in filtered calculations
- `src/hooks/useBusinessHealth.ts` — use spread in MoM calculations

