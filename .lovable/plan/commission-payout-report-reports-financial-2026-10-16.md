# Commission Payout Report (Reports > Financial)

Adds a "Commissions" section to the Financial tab of Business Reports, built from the commission statements you already generate.

## What you get

1. **Summary tiles**
   - Outstanding (unpaid) commission total, with the number of statements
   - Paid in the selected period
   - Total owed all-time vs paid all-time

2. **Remaining to pay out** — list of unpaid statements, grouped by location:
   - Location name, contact, statement period, revenue, rate, amount owed, days since issued
   - Oldest first, so overdue payouts stand out
   - "Mark paid" button on each row (records today's date as paid, same as the existing paid toggle on location details)

3. **Payout history** — paid statements in the selected date range:
   - Who (location + contact), period covered, amount, and the date it was paid
   - Newest first, with a per-location subtotal

4. Included in the existing CSV/PDF export for the Financial tab.

## Technical notes

- Data comes from `commission_summaries` (already fetched in `useReportsData`) joined with location name/contact; outstanding list ignores the date filter (always shows everything still owed), history filters by `commission_paid_at`.
- New `src/components/reports/CommissionPayoutReport.tsx`, rendered at the bottom of `FinancialReports.tsx`.
- "Mark paid" updates `commission_paid` / `commission_paid_at` and invalidates the reports query. No schema changes.
- Add a "commissions" CSV export type in `csvExport.ts`.
