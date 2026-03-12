

## Update RouteRunStopView Win Rate Messaging to Match Revenue Form

### What changes

The RouteRunStopView currently uses custom inline messaging ("Running hot", "Running tight", "On target") that doesn't match the Revenue Tracker form's phrasing ("Running on target", "Paying out X% more/less than expected"). Need to use the `compareToExpected` helper from `useMachineCollections` instead of the inline logic.

### Files to change

| File | Change |
|---|---|
| `src/components/mileage/RouteRunStopView.tsx` | Import `useMachineCollections` hook, use `compareToExpected` for win rate messaging instead of inline comparison logic. Update message display to match Revenue Tracker form style. |

### Messaging change

Current messages in RouteRunStopView:
- "On target"
- "Running hot (+15%)"
- "Running tight (-10%)"

Should match Revenue Tracker form:
- "Running on target"
- "Paying out 15% more than expected"
- "Paying out 10% less than expected"

### Implementation

Replace the inline `getMachineCalc` function's comparison logic with a call to `compareToExpected(trueWinRate, machine.winProbability)` from the `useMachineCollections` hook.

