# Commissions Tab With Its Own Date Range

## What you get

1. **New "Commissions" tab** in Business Reports, next to Financial. The payout report moves there and comes off the bottom of the Financial tab, so it isn't shown twice.

2. **Date range picker inside the tab**, at the top of the report:
   - Quick presets: This Month, Last Month, Last 3 Months, This Year, Last Year, All Time
   - Custom range: two calendar pickers for start and end dates
   - It starts with the page's date range. Changing it here only changes the Commissions tab.

3. **What the range controls**
   - Payout History and "Paid this period": payouts made inside the range (by paid date)
   - Remaining to Pay Out: a toggle between "All outstanding" (the default, so nothing you owe gets hidden) and "Only statements in this range" (by statement period)
   - The all-time cards stay all-time

4. The CSV export for this tab uses the selected range and toggle.

## Technical notes

- `Reports.tsx`: add a `commissions` tab (HandCoins icon) that renders `CommissionPayoutReport`. Remove the report from `FinancialReports.tsx`.
- `CommissionPayoutReport`: local `range` state that starts from `data.dateRange`, a preset `Select`, and two shadcn date pickers (Popover + Calendar with `pointer-events-auto`). Also an `outstandingScope` switch.
- The CSV export function takes optional range/scope arguments, and the component gets its own "Export CSV" button.
- No database changes.
