
## Goal (what you’re asking)
Fix the *commission PDF timeframe* so that when you choose presets like **Last Month** or **This Month**, the PDF shows the correct month range (e.g., **Jan 1 – Jan 31**) and does not shift to **Dec 31 – Jan 31**.

This is a date parsing/formatting issue caused by treating date-only strings like full timestamps (timezone shift).

---

## What’s happening (root cause)
There are two different “paths” that can produce/print a commission PDF:

1) **CommissionSummaryGenerator page** (`src/components/CommissionSummaryGenerator.tsx`)
- Presets set `startDate/endDate` as JS `Date` objects.
- When saving to the backend, it currently uses `toISOString()` which stores full timestamps (UTC).
- “This Month” preset currently sets end date to **today**, not end of month.

2) **Printing from a Location’s commission history** (`src/components/LocationDetailDialog.tsx`) — you’re on `/locations`
- Commission summary records come back as **date-only strings** (`"YYYY-MM-DD"`).
- The code uses `new Date("YYYY-MM-DD")`, which is interpreted as **UTC midnight**, then converted to local time for display.
- In many timezones, that becomes the **previous calendar day**, causing “Jan 1” to show as **Dec 31**.

So even if the stored value is correct, the UI/PDF output becomes wrong due to timezone conversion.

---

## Fix strategy (simple + correct)
### A) Always parse date-only strings as local calendar dates
Create a small helper (in-place in the files we touch) like:

- If value is `"YYYY-MM-DD"`:
  - parse into `new Date(year, monthIndex, day)` (local time), not `new Date(string)`

This guarantees “Jan 1” stays “Jan 1” in every timezone.

### B) Store commission summary dates as date-only strings
When saving commission summaries, store:
- `start_date = format(date, "yyyy-MM-dd")`
- `end_date = format(date, "yyyy-MM-dd")`

This matches how the database is typed (string/date-like) and avoids timestamp drift.

### C) Adjust “This Month” preset to match your expectation
Update `setThisMonth()` so end date is:
- `endOfMonth(today)`
not today’s date, so “This Month” prints the full month range.

---

## Concrete code changes (by file)

### 1) `src/components/LocationDetailDialog.tsx`
**Change all usages of:**
- `new Date(summary.startDate)` and `new Date(summary.endDate)`

**To:**
- a safe `parseDateOnly(summary.startDate)` / `parseDateOnly(summary.endDate)`

This affects:
- `periodText` in `printCommissionSummary`
- the PDF filename date
- the visible date range in the commissions list UI
- the delete warning date range text

**Expected result:**
Commission PDFs and UI dates printed from `/locations` show correct month boundaries.

---

### 2) `src/components/CommissionSummaryGenerator.tsx`
**Preset fix:**
- `setThisMonth()` should set:
  - `startDate = startOfMonth(today)`
  - `endDate = endOfMonth(today)`  
So “This Month” means the full month, not “month-to-date”.

**Saving fix:**
When calling `addCommissionSummary(...)`, instead of:
- `startDate: locationData.startDate.toISOString()`
- `endDate: locationData.endDate.toISOString()`

Use:
- `startDate: format(locationData.startDate, "yyyy-MM-dd")`
- `endDate: format(locationData.endDate, "yyyy-MM-dd")`

**Expected result:**
Newly created commission summaries will store stable, timezone-safe dates and print correctly everywhere.

---

### 3) `src/hooks/useLocationsDB.ts`
In `deleteCommissionSummary(...)` (cascade delete logic):
- It currently does `new Date(summary.end_date)` for matching related revenue entries.
- If `summary.end_date` is date-only, we should parse it with the same date-only parsing helper to avoid off-by-one day windows (which can cause the revenue entry match/delete to miss).

**Expected result:**
Commission deletion continues to reliably delete the linked revenue tracker expense even across timezones.

---

## QA checklist (how we’ll verify)
1) Go to **Commission Summary** page:
   - Click **Last Month**
   - Confirm it shows `Jan 01 - Jan 31` (for January example) in the period display and in the PDF.
2) Click **This Month**
   - Confirm it shows `Feb 01 - Feb 29` (or `Feb 28`) depending on year, not `Feb 01 - today`.
3) Go to **Locations → open a location → Commissions**
   - Print an existing commission summary (previously saved)
   - Confirm it prints `Jan 01 - Jan 31` (no Dec 31)
4) Delete a commission summary:
   - Confirm warning shows correct period
   - Confirm linked Revenue Tracker expense is removed as expected.

---

## Scope boundaries (what we are NOT changing)
- No changes to the commission math or payout amounts
- No changes to the “Generated on” text
- Only fixing the **period/timeframe shown** and the underlying date parsing/saving so it’s always accurate

---

## Files we will modify
- `src/components/LocationDetailDialog.tsx`
- `src/components/CommissionSummaryGenerator.tsx`
- `src/hooks/useLocationsDB.ts`
