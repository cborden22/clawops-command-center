

## Inventory Tracker UI Cleanup

### Problems

1. **Quantity numbers cut off** -- The quantity input is `w-16` (64px wide) which clips numbers like "1000+" on smaller screens
2. **Item cards are cramped** -- Name, badges, edit buttons, and quantity controls all squeeze onto one row, causing overflow on mobile
3. **Subtitle text overflows** -- The "Buys in: Case of 24 | Last cost: $15.00/case ($0.63/ea)" line wraps awkwardly or gets cut off
4. **Quantity controls too tight** -- The minus/input/plus cluster has no breathing room

---

### Changes

#### Item Card Layout (lines 633-929)

- Widen the quantity input from `w-16` to `w-20` so numbers up to 99,999 display without clipping
- Switch the card layout from a single-row flex to a **two-row layout on mobile**: top row = name + badges, bottom row = quantity controls. On desktop, keep the single-row layout using responsive classes
- Give the quantity number more visual weight with slightly larger text
- Add `text-right` to the quantity input so digits align predictably

#### Subtitle Cleanup (lines 694-707)

- Break the subtitle into separate lines on mobile instead of one long line with dots and pipes
- Show quantity prominently as a standalone number badge rather than buried in the subtitle

#### Quick Stats Cards (lines 449-482)

- Make the total stock number use `tabular-nums` for consistent digit width
- Minor spacing polish

#### Normal Mode Controls (lines 884-927)

- Wrap the minus/qty/plus and delete button in a `shrink-0` container so the quantity controls never get squished by long item names

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/InventoryTrackerComponent.tsx` | Widen qty input, restructure item card to two-row mobile layout, clean up subtitle display, improve spacing |

