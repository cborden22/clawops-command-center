## Integrate Recurring Revenue as a Checkbox in the Entry Form

### What changes

Remove the separate `RecurringRevenueManager` card from the Revenue Tracker page. Instead, add a "Make this recurring" checkbox directly into the income/expense entry form. When checked, a frequency picker appears (weekly, biweekly, monthly, yearly). On submit, the system creates both the normal revenue entry AND a `recurring_revenue` record.

The existing "Generate Due" entries functionality moves to a small inline banner at the top of the Revenue Tracker (if there are due items), keeping the auto-generation accessible without a dedicated card.

### Files to change


| File                                                 | Change                                                                                                                                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/RevenueTracker.tsx`                       | Remove `RecurringRevenueManager` import and rendering. Add a small "Generate Due" banner using `useRecurringRevenue` hook when `dueCount > 0`.                                                                                        |
| `src/components/RevenueTrackerComponent.tsx`         | Add "Recurring" checkbox + frequency selector to the Log Entry form (after notes, before submit button). On submit, if recurring is checked, also insert into `recurring_revenue` table. Import `Checkbox` and `useRecurringRevenue`. |
| `src/components/mobile/QuickRevenueForm.tsx`         | Add same "Recurring" checkbox + frequency selector. On submit, also create `recurring_revenue` entry when checked.                                                                                                                    |
| `src/components/revenue/RecurringRevenueManager.tsx` | Keep file but it will no longer be imported (dead code for now).                                                                                                                                                                      |


### Form addition (both desktop and mobile)

After the Notes field and before the Submit button, add:

```text
┌─────────────────────────────────┐
│ ☐ Make this recurring           │
│   [Weekly ▼] (shown if checked) │
└─────────────────────────────────┘
```

When the entry is submitted with "recurring" checked:

1. Normal revenue entry is created as usual
2. A `recurring_revenue` row is also inserted with `next_due_date` set to the entry date + frequency interval, using the same amount, location, and category

### Generate Due banner

At the top of the Revenue Tracker page, if `dueCount > 0`, show a compact alert-style banner:

```text
┌──────────────────────────────────────────┐
│ ⚡ 3 recurring entries are due  [Generate]│
└──────────────────────────────────────────┘
```

This replaces the full `RecurringRevenueManager` card.