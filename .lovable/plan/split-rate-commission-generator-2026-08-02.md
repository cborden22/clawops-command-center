# Split-Rate Commission Generator

Some locations pay different commission percentages per machine type (e.g. 40% on a boxing machine, 20-25% on claw machines). Today the generator applies one rate to one revenue total. This adds a second generator for mixed-rate locations without touching the existing one.

## What you get

The Commission Summary page gets two tabs:

- **Standard** — the current generator, unchanged.
- **Split Rate** — new, for locations with different rates per machine.

### Split Rate flow

1. Pick a saved location (or type the business name manually). Contact person auto-fills.
2. Pick the period with the same Last Week / Last Month / This Month quick presets and date pickers.
3. A machine rows table pre-populates from the location's machines, one row per machine:

```text
Machine              Revenue     Rate %    Commission
Boxing Machine       $  850.00     40        $340.00
Claw Machine #1      $  620.00     25        $155.00
Claw Machine #2      $  410.00     20         $82.00
-------------------------------------------------------
Totals               $1,880.00   ~30.7%      $577.00
```

- Revenue and rate are typed per row; commission calculates live.
- Add a custom row or remove a row for machines not in service that period.
- Footer shows total revenue, total commission, and the blended effective rate.
4. Same "Show revenue on PDF" toggle as the standard generator.
5. Notes field, then Generate PDF.

### PDF output

Same visual style as the current summary, with the single revenue/commission block replaced by a per-machine breakdown table (machine, revenue, rate, commission) followed by the highlighted total commission payment. With the revenue toggle off, the table shows machine, rate, and commission only.

### Recording

Identical to today: saves a commission summary on the location (total revenue, blended rate, total commission, machine count) and logs one "Commission Payout" expense in the Revenue Tracker for the total. The per-machine breakdown is written into the summary notes so it stays visible in the location's history.

## Technical notes

- New `src/components/SplitRateCommissionGenerator.tsx`; `CommissionSummaryGenerator.tsx` untouched.
- `src/pages/CommissionSummary.tsx` wraps both in shadcn `Tabs` (hero section unchanged).
- Rates are entered in the generator only — no schema change. Rows seed from `useLocations().getLocationById(id).machines` (label/customLabel, expanded by `count`), rate defaults to the location's `commissionRate`.
- Reuses `generatePDFFromHTML`, `sanitizeForHTML`, `addCommissionSummary`, and `addRevenueExpense` exactly as the standard generator does.
- Blended rate = total commission / total revenue * 100, guarded against divide-by-zero.
