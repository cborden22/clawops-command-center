

## True Win Rate Calculator Implementation

### Overview
Update the win rate calculation system to use the **True Win Rate** formula based on actual plays, not raw coin counts. This provides accurate machine performance metrics that reflect real customer experience.

---

### The Problem
Currently, win rate is calculated as:
```
Win Rate = Prizes Won / Coins Inserted
```

This is incorrect because it treats each coin as a play. In reality:
- Coins are counted as quarters ($0.25 each)
- Machines have different "Cost Per Play" settings ($0.50, $1.00, etc.)
- A machine requiring $1.00 per play needs 4 quarters (coins) for 1 play

---

### The Solution
Update all calculations to use:
```
Total Dollars = Coins Inserted x $0.25
Total Plays = Total Dollars / Cost Per Play
True Win Rate = Prizes Won / Total Plays
True Odds = Total Plays / Prizes Won (1 in X)
```

---

### Changes Required

#### 1. Update `useMachineCollections` Hook (`src/hooks/useMachineCollections.ts`)

Modify the calculation functions to accept `costPerPlay` parameter:

| Function | Current Signature | New Signature |
|----------|------------------|---------------|
| `calculateCollectionWinRate` | `(coinsInserted, prizesWon)` | `(coinsInserted, prizesWon, costPerPlay?)` |
| `calculateMachineStats` | `(machineId)` | `(machineId, costPerPlay?)` |
| `calculateLocationStats` | `(locationId)` | No change (aggregates won't use machine-specific cost) |

New internal calculations:
```typescript
const QUARTER_VALUE = 0.25;

// Convert coins to plays
const totalDollars = coinsInserted * QUARTER_VALUE;
const totalPlays = costPerPlay > 0 ? totalDollars / costPerPlay : coinsInserted;

// Calculate TRUE win rate
const trueWinRate = totalPlays > 0 ? prizesWon / totalPlays : 0;
const trueOdds = trueWinRate > 0 ? 1 / trueWinRate : 0;
```

Add new interface for extended stats:
```typescript
export interface TrueWinRateStats {
  coinsInserted: number;
  prizesWon: number;
  totalDollars: number;
  totalPlays: number;
  trueWinRate: number;  // decimal (e.g., 0.125 = 12.5%)
  trueOdds: number;     // "1 in X" format (e.g., 8)
}
```

#### 2. Update UI Display Labels

Change terminology across all components:
- "Win Rate" becomes "True Win Rate"
- Display shows plays, not just coins

#### 3. Update Collection Reports Sheet (`src/components/mobile/CollectionReportsSheet.tsx`)

- Pass machine's `costPerPlay` to `calculateCollectionWinRate`
- Display "plays" alongside coins in the stats
- Update labels to show "True Win Rate"

#### 4. Update Quick Revenue Form (`src/components/mobile/QuickRevenueForm.tsx`)

- Calculate and show plays based on selected machine's cost per play
- Update live win rate display to show "True Win Rate"
- Add plays count to the live feedback

#### 5. Update Revenue Tracker Component (`src/components/RevenueTrackerComponent.tsx`)

- Pass `costPerPlay` from selected machine to calculations
- Update stats display in collection metrics section

#### 6. Update Location Detail Dialog (`src/components/LocationDetailDialog.tsx`)

- Pass each machine's `costPerPlay` to stats calculations
- Update per-machine breakdown to show plays and true win rate

---

### Files Summary

| File | Changes |
|------|---------|
| `src/hooks/useMachineCollections.ts` | Update all calculation functions to use True Win Rate formula with costPerPlay parameter |
| `src/components/mobile/CollectionReportsSheet.tsx` | Pass costPerPlay to calculations, update display labels |
| `src/components/mobile/QuickRevenueForm.tsx` | Show plays count, update live win rate display |
| `src/components/RevenueTrackerComponent.tsx` | Update collection metrics display |
| `src/components/LocationDetailDialog.tsx` | Update machine stats displays with true win rate |

---

### Example Calculation

**Input:**
- Coins Inserted: 200 quarters
- Prizes Won: 5
- Cost Per Play: $1.00

**Current (Wrong):**
- Win Rate = 5 / 200 = 2.5% (1 in 40)

**True Win Rate (Correct):**
- Total Dollars = 200 x $0.25 = $50.00
- Total Plays = $50.00 / $1.00 = 50 plays
- True Win Rate = 5 / 50 = 10% (1 in 10)

---

### Performance Benchmarks Display

Add helpful context to the UI when displaying True Win Rate:
- 1 in 7-8: Very generous (badge: green)
- 1 in 8-9: Optimal (badge: blue)
- 1 in 10+: Tight (badge: amber/red)

---

### Technical Details

#### Default Cost Per Play
If a machine doesn't have a `costPerPlay` set, default to $0.50 (2 quarters per play) to maintain backward compatibility.

#### Fallback Behavior
For aggregate location stats where machines have different costs per play, the calculation will use weighted averages or clearly indicate "varies by machine."

---

### User Experience

After this change, users will see:
1. **During Collection Entry**: "200 coins = 50 plays = $50.00" with True Win Rate
2. **In Reports**: "50 plays → 5 prizes (1 in 10)" instead of "200 coins → 5 prizes"
3. **Performance Feedback**: Accurate comparison to machine's expected 1-in-X setting

