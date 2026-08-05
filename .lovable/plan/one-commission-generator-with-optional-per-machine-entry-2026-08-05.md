# One Commission Generator With Optional Per-Machine Entry

Today the Commission Summary page has two tabs: Standard (one revenue total, one rate) and Split Rate (a per-machine table). That split is confusing — you shouldn't have to pick a mode before you know how you want to enter the numbers. This merges them into a single generator where the per-machine breakdown is always available.

## What you get

One form, no tabs:

1. Pick a saved location (or type the business name). Contact person auto-fills.
2. Pick the period with the same Last 7 Days / This Month / Last Month presets and date pickers.
3. **Sales entry** section with a toggle:

```text
Entry mode:  ( ) Single total     (•) Per machine

Machine              Revenue     Rate %    Commission
Boxing Machine       $  850.00     40        $340.00
Claw Machine #1      $  620.00     25        $155.00
Claw Machine #2      $  410.00     20         $82.00
----------------------------------------------------
Totals               $1,880.00   ~30.7%      $577.00
```

- **Single total** — one revenue field and one rate field, exactly like the current Standard form.
- **Per machine** — rows seeded from the location's machines (each machine's own commission %, falling back to the location rate). Type revenue per row, adjust the rate, add or remove rows. Footer shows total revenue, total commission, and the blended rate.
- Switching modes keeps your numbers: going per-machine seeds rows from the saved machines; going back to single total carries the computed totals into the single fields.
4. "Show revenue on PDF" toggle and notes, then Generate PDF.

## PDF output

Same document as today. With per-machine entry on, the summary includes the machine breakdown table (machine, revenue, rate, commission) plus the highlighted total. With single total, it prints the current single revenue/rate/commission block. The revenue toggle still hides revenue columns when off.

## Recording

Unchanged: saves a commission summary on the location (total revenue, blended or single rate, total commission, machine count) and logs one "Commission Payout" expense in the Revenue Tracker. The per-machine breakdown is appended to the summary notes when used.

## Technical notes

- `CommissionSummaryGenerator.tsx` absorbs the machine-row state, `rowCommission`/blended-rate math, and the breakdown PDF section from `SplitRateCommissionGenerator.tsx`, gated on an `entryMode: "total" | "machines"` state.
- Row seeding reuses the existing logic: expand `location.machines` by `count`, rate = `m.commissionRate ?? location.commissionRate`.
- `src/pages/CommissionSummary.tsx` drops the `Tabs` wrapper and renders the single generator inside the existing glass card; hero section unchanged.
- `SplitRateCommissionGenerator.tsx` is deleted once its logic is merged.
- No schema or data-layer changes; `addCommissionSummary` and `addRevenueExpense` are called exactly as today.
