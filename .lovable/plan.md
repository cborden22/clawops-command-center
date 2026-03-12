

## Overhaul Route Run Stop View to Match Revenue Form

### What changes

The RouteRunStopView currently has basic coin/prize inputs per machine but lacks three key features from the revenue forms:

1. **Dollar amount calculation from coins** — show the `coins × $0.25 = $X.XX` breakdown and plays count
2. **Win probability / expected comparison** — show true win rate, odds, and compare to machine's expected probability
3. **Spread across service period** toggle — let the user control revenue accrual during route runs

### Files to change

| File | Change |
|---|---|
| `src/components/mileage/RouteRunStopView.tsx` | Major rework: fetch `win_probability` and `cost_per_play` from location_machines, import `useMachineCollections` for calculation helpers, add dollar/plays display per machine, add live win rate stats, add service period toggle. Restructure machine collection cards to match revenue form style. |
| `src/hooks/useRouteRun.ts` | Update `StopResult` interface to include `spreadRevenue`, `servicePeriodStart`, `servicePeriodEnd`. In `completeStop`, when saving a revenue entry for the stop's collections, pass service period data and create the revenue_entry with accrual dates. |

### RouteRunStopView detail

**Machine card rework** — each machine card currently has two plain inputs. Replace with:

```text
┌─────────────────────────────────────┐
│ Claw Machine #1                     │
│                                     │
│ Coins Inserted                      │
│ ┌─────────────────────────────────┐ │
│ │            56                   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 56 coins = 28 plays   $14.00   │ │
│ │ $0.50 per play                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Prizes Won (Optional)               │
│ ┌─────────────────────────────────┐ │
│ │            2                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Win Rate: 1 in 14 (7.1%)           │
│ 28 plays → 2 prizes                │
│ Expected: 1 in 15 • Running hot    │
└─────────────────────────────────────┘
```

**Service period toggle** — added after the machine collections card, before notes:

```text
┌─────────────────────────────────────┐
│ 📅 Spread across service period  [ON]│
│ Revenue spread from Feb 20 to today │
│ (13 days)                           │
└─────────────────────────────────────┘
```

Fetches location's `last_collection_date` to compute the service period start.

### Data flow changes

- `LocationMachine` interface gets `winProbability` and `costPerPlay` (fetch `win_probability`, `cost_per_play` from DB)
- Import `useMachineCollections` hook for `calculateCollectionWinRate`, `formatWinRate`, `formatOdds`, `formatPlays`, `compareToExpected`, `QUARTER_VALUE`
- `StopResult` gains `spreadRevenue`, `servicePeriodStart`, `servicePeriodEnd` fields
- `completeStop` in `useRouteRun.ts` uses these to create a `revenue_entry` with service period data when saving stop collections (currently it only saves to `machine_collections` — it should also create a revenue entry per stop)

