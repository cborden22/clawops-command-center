

## Add Date Selection to Stock Runs

### Overview
Currently, stock runs are automatically recorded with the current date/time when confirmed. This enhancement will allow users to specify a custom date for their stock run, which is useful when:
- Logging a stock run that happened earlier in the day
- Catching up on stock runs from previous days
- Recording stock runs retroactively for accurate history

---

### Changes Required

#### 1. Update `saveStockRunHistory` Function (`src/hooks/useInventoryDB.ts`)

Add an optional `runDate` parameter to the function that saves stock run history:

| Current | Updated |
|---------|---------|
| `saveStockRunHistory(userId, items)` | `saveStockRunHistory(userId, items, runDate?)` |

When `runDate` is provided, it will be used for the `run_date` column instead of the default `now()`.

---

#### 2. Add Date State to InventoryTrackerComponent (`src/components/InventoryTrackerComponent.tsx`)

Add new state for the selected stock run date:
- `stockRunDate` - defaults to today's date
- Reset to today when starting a new stock run
- Display in the confirmation sheet with ability to change

---

#### 3. Update Stock Run Confirmation Sheet UI

Add a date picker to the confirmation sheet between the header and items list:

```
┌─────────────────────────────────────────┐
│ Confirm Stock Run                       │
│ Review items to deduct from inventory   │
├─────────────────────────────────────────┤
│ Stock Run Date                          │
│ ┌─────────────────────────────────────┐ │
│ │  📅  January 26, 2026          ▼   │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [Item cards...]                         │
│                                         │
│ ─────────────────────────────────────── │
│          42 total pieces                │
│        from 5 products                  │
│ ┌─────────────────────────────────────┐ │
│ │      ✓ Confirm Stock Run            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

The date picker will:
- Default to today's date
- Allow selecting any past date (not future dates)
- Use the existing Popover/Calendar pattern from the project

---

#### 4. Pass Date to Save Function

When `handleConfirmStockRun` is called, pass the selected date to `saveStockRunHistory`.

---

#### 5. Update LocalStorage Data Structure

The `LastStockRun` interface will include the selected date:
```typescript
interface LastStockRun {
  items: { id: string; name: string; quantity: number }[];
  timestamp: number;
  runDate: string; // ISO date string of the stock run
  historyId: string | null;
}
```

---

### Technical Details

#### Modified Files

| File | Changes |
|------|---------|
| `src/hooks/useInventoryDB.ts` | Add optional `runDate` parameter to `saveStockRunHistory` function |
| `src/components/InventoryTrackerComponent.tsx` | Add `stockRunDate` state, date picker UI in confirmation sheet, pass date to save function |

#### New Imports Needed

In `InventoryTrackerComponent.tsx`:
- `Calendar` icon from lucide-react
- `Calendar` component from `@/components/ui/calendar`
- `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/ui/popover`
- `format` from `date-fns`

---

### User Experience

1. User clicks "Start Stock Run"
2. User adds items to their cart as usual
3. User clicks "Review" to open confirmation sheet
4. **New**: Date picker shows "Today" by default
5. User can tap to change the date if logging a past stock run
6. User confirms the stock run
7. Stock run history shows the selected date, not the confirmation time

---

### Edge Cases Handled

- **Future dates blocked**: Cannot select dates in the future
- **Date reset on new run**: Each new stock run starts with today's date
- **Timezone handling**: Uses local timezone for date selection and display
- **History display unchanged**: The `StockRunHistory` component already displays dates correctly from the `run_date` field

