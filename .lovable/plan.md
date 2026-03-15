

## Add Optional Bag Label to Collections

A simple text input field added to both the Route Run stop view and the Quick Revenue form. Users can optionally type a bag identifier (e.g., "Red #1", "Bag 3") that gets saved with each machine collection record. No new tables needed -- just a column on `machine_collections`.

### Database Change

Add a nullable `bag_label` text column to `machine_collections`:

```sql
ALTER TABLE public.machine_collections ADD COLUMN bag_label text;
```

### Files to Change

| File | Change |
|---|---|
| `src/hooks/useRouteRun.ts` | Add `bagLabel` to `StopCollectionData`. Pass it when inserting into `machine_collections` in `completeStop`. |
| `src/components/mileage/RouteRunStopView.tsx` | Add a text input for "Bag Label" per machine card (below prizes input). Store in collections state. Pass to `StopCollectionData`. |
| `src/hooks/useMachineCollections.ts` | Add optional `bagLabel` to `CollectionInput` and include it in the insert call. |
| `src/components/mobile/QuickRevenueForm.tsx` | Add an optional "Bag Label" text input when recording a machine collection. Pass to `addCollection`. |

### UI

Each machine card gets a small text input at the bottom:

```
Bag / Tag (Optional)
┌─────────────────────────────────┐
│  e.g. Red #1, Bag 3            │
└─────────────────────────────────┘
```

Simple `<Input>` with placeholder text, no dropdowns or color pickers. The value is stored as plain text in `machine_collections.bag_label`.

