
## Routes Tracker Redesign - Odometer-Only with Smart Location Selection

### Overview
Complete redesign of the Mileage Tracker to become a streamlined **Routes** section with odometer-only tracking and smart location dropdowns. This eliminates manual mile entry, removes the confusing round-trip toggle, and provides a consistent experience for logging trips.

---

### Key Changes Summary

| Current | New |
|---------|-----|
| "Mileage Tracker" | "Routes" |
| Manual miles OR odometer mode | Odometer-only (required) |
| Round trip toggle | Removed (odometer calculates actual miles) |
| Free-text "From" field | Dropdown: Warehouse, Locations, or Custom |
| Free-text "To" field | Dropdown: Locations or Custom |
| Odometer mode is optional toggle | Odometer is the only mode |

---

### User Flow

```
1. User navigates to "Routes"
2. To log a trip:
   a. Select vehicle (required)
   b. Select FROM: Warehouse (default), Saved Location, or Custom
   c. Select TO: Saved Location or Custom  
   d. Enter Start Odometer reading
   e. Enter End Odometer reading
   f. System auto-calculates miles (End - Start)
   g. Select purpose (optional)
   h. Add notes (optional)
   i. Click "Log Trip"
```

---

### UI Design

**Location Dropdowns**

Both "From" and "To" will be Select dropdowns with these options:

**FROM dropdown:**
- "Warehouse" (uses warehouse address from settings, shown first)
- [Divider]
- All active saved locations (from Locations page)
- [Divider]  
- "Enter Custom Location..." (reveals text input when selected)

**TO dropdown:**
- All active saved locations (from Locations page)
- [Divider]
- "Enter Custom Location..." (reveals text input when selected)

When "Enter Custom Location" is selected, a text input appears below the dropdown for the user to type their custom location.

---

### Navigation Updates

**Desktop Sidebar:**
- Change "Mileage Tracker" to "Routes"
- Keep same URL `/mileage` (or change to `/routes` - both work)

**Mobile Bottom Nav:**
- "Mileage" in More menu becomes "Routes"

**Page Header:**
- Title: "Routes"
- Subtitle: "Log business trips for tax deductions ($0.67/mile IRS rate)"

---

### Form Simplification

**What's Removed:**
1. Manual "Miles" input field - gone entirely
2. "Use Odometer" toggle - odometer is now the only mode
3. Round Trip toggle - the odometer captures actual miles driven
4. Route quick-select temporarily simplified (routes now just pre-fill purpose)

**What Stays:**
1. Vehicle selector (required)
2. Date picker
3. Purpose dropdown
4. Notes field
5. Odometer start/end inputs

---

### Technical Changes

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/components/layout/AppSidebar.tsx` | Rename "Mileage Tracker" to "Routes" |
| `src/components/layout/MobileBottomNav.tsx` | Rename "Mileage" to "Routes" |
| `src/pages/MileageTracker.tsx` | Complete redesign of Log Trip tab |
| `src/components/mobile/QuickMileageForm.tsx` | Simplify to odometer-only with location dropdowns |
| `src/hooks/useMileageDB.ts` | Remove round-trip logic (stored as-is from odometer) |

**Files to Create:**

| File | Purpose |
|------|---------|
| `src/components/mileage/LocationSelector.tsx` | Reusable dropdown component for From/To selection |

---

### LocationSelector Component Design

```typescript
interface LocationSelectorProps {
  type: "from" | "to";  // Determines if Warehouse option is shown
  value: { type: "warehouse" | "location" | "custom"; locationId?: string; customName?: string };
  onChange: (value) => void;
  locations: Location[];
  warehouseAddress?: string;
}
```

The component renders:
1. A Select dropdown with grouped options
2. Conditionally shows a text Input below when "custom" is selected
3. Displays the warehouse address or location name in the trigger

---

### Data Model Changes

**Remove from form state:**
- `miles` - no longer manually entered
- `isRoundTrip` - removed entirely
- `odometerMode` toggle - always odometer mode now

**Keep in form state:**
- `selectedVehicleId` (now required)
- `odometerStart` (required)
- `odometerEnd` (required)
- `fromSelection` (new structured object)
- `toSelection` (new structured object)
- `purpose`
- `notes`
- `tripDate`

**Database stays the same:**
- `mileage_entries` table already has all needed columns
- `is_round_trip` column can be deprecated (set to false)
- Miles are stored as `odometer_end - odometer_start`

---

### Settings Context

**Remove:**
- `preferOdometerMode` setting - no longer needed (always odometer mode)

---

### Validation Rules

1. **Vehicle Required** - Must select a vehicle
2. **From Required** - Must select or enter a start location
3. **To Required** - Must select or enter an end location
4. **Odometer Start Required** - Must enter start reading
5. **Odometer End Required** - Must enter end reading
6. **End > Start** - End odometer must be greater than start
7. **Large Jump Warning** - Show warning (not error) if miles > 500

---

### Route Templates Behavior

The existing Routes tab (for creating saved routes) remains but simplified:
- Routes now only pre-fill the **purpose** field (route name)
- They no longer pre-fill miles or round-trip (since odometer captures actual)
- They can optionally pre-fill From/To locations if defined

---

### Visual Layout - Log Trip Form

```
┌─────────────────────────────────────┐
│ [Date Picker: Today]                │
├─────────────────────────────────────┤
│ Vehicle *                           │
│ [Select a vehicle...          ▼]    │
│ Last recorded: 45,230 mi            │
├─────────────────────────────────────┤
│ From *                              │
│ [Warehouse                    ▼]    │
│ 123 Main St, Anytown USA            │
├─────────────────────────────────────┤
│ To *                                │
│ [Select location...           ▼]    │
│ (if Custom selected:)               │
│ [Enter location name...]            │
├─────────────────────────────────────┤
│ ┌──────────────┐ ┌────────────────┐ │
│ │ Start        │ │ End            │ │
│ │ [  45230  ]  │ │ [  45276  ]    │ │
│ └──────────────┘ └────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Calculated Miles:    46.0 mi    │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Purpose                             │
│ [Collection Run               ▼]    │
├─────────────────────────────────────┤
│ Notes (optional)                    │
│ [                               ]   │
├─────────────────────────────────────┤
│         [ Log Trip ]                │
└─────────────────────────────────────┘
```

---

### Migration Considerations

**Existing Data:**
- All existing mileage entries continue to work
- Entries with `odometer_start` and `odometer_end` are already compliant
- Entries without odometer data (manual entries) are historical and display correctly
- `is_round_trip` field remains in DB but new entries will always be `false`

**No Breaking Changes:**
- History tab shows all entries regardless of how they were logged
- Export includes all historical data
