

## Odometer-Based Mileage Tracking System (Updated)

### Overview
Add an **Odometer Tracking Mode** that lets users record mileage by entering start and end odometer readings instead of manually calculating miles. This eliminates guesswork and provides verifiable mileage records for tax purposes.

---

### Key Change from Original Proposal

**Removed: Auto-prefill start odometer**

Since vehicles are often used for personal trips between business trips, the last recorded business trip's ending odometer won't match the current odometer. Users must manually enter both readings each time.

| Original Proposal | Updated Approach |
|-------------------|------------------|
| Auto-fill start odometer from last trip | User enters current odometer reading manually |
| Pre-fill on vehicle selection | Show last recorded reading as reference only (optional) |

---

### User Flow

```
1. User goes to Mileage Tracker
2. User toggles "Use Odometer"
3. User selects their vehicle (or adds a new one)
4. User enters current START odometer reading
5. User optionally selects a route for location details
6. User drives their route
7. User enters END odometer reading
8. System calculates: End - Start = Miles Driven
9. Trip is logged with all details
```

---

### Database Changes

**New Table: `vehicles`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner reference |
| name | text | Vehicle nickname (e.g., "Work Van") |
| year | integer | Model year (optional) |
| make | text | Manufacturer (optional) |
| model | text | Model name (optional) |
| license_plate | text | License plate (optional) |
| last_recorded_odometer | numeric | Last recorded odometer (reference only, not auto-fill) |
| created_at | timestamp | Creation date |
| updated_at | timestamp | Last update |

**Update Table: `mileage_entries`**
| New Column | Type | Description |
|------------|------|-------------|
| vehicle_id | uuid | Reference to vehicle (nullable) |
| odometer_start | numeric | Starting odometer reading (nullable) |
| odometer_end | numeric | Ending odometer reading (nullable) |

---

### UI Changes

#### 1. Settings Page (`src/pages/Settings.tsx`)
- Add new "Vehicles" section in App Settings tab
- Allow users to add/edit/delete vehicles
- Fields: Name (required), Year, Make, Model, License Plate
- Show "Last recorded odometer" as read-only info

#### 2. Mileage Tracker Page (`src/pages/MileageTracker.tsx`)
- Add "Use Odometer" toggle at top of Log Trip form
- When enabled:
  - Show vehicle selector dropdown
  - Show Start Odometer input (empty, user must enter)
  - Show End Odometer input
  - Auto-calculate and display miles as user types
  - Hide the manual "Miles" input
  - Keep route selector (for location/purpose auto-fill)
  - Optionally show "Last recorded: X miles" as helper text

#### 3. Mobile Quick Mileage Form (`src/components/mobile/QuickMileageForm.tsx`)
- Add same odometer toggle and fields
- Large number inputs optimized for touch
- Both odometer fields require manual entry

#### 4. AppSettingsContext (`src/contexts/AppSettingsContext.tsx`)
- Add `preferOdometerMode` boolean setting
- Remembers user's preferred entry mode

---

### New Hook: `useVehiclesDB.ts`

```typescript
interface Vehicle {
  id: string;
  name: string;
  year?: number;
  make?: string;
  model?: string;
  licensePlate?: string;
  lastRecordedOdometer?: number; // Reference only
  createdAt: Date;
  updatedAt: Date;
}

// Functions:
// - vehicles: Vehicle[]
// - addVehicle(vehicle)
// - updateVehicle(id, updates)
// - deleteVehicle(id)
// - getVehicleById(id)
```

---

### Updated `useMileageDB.ts`

Add to `MileageEntry` interface:
```typescript
vehicleId?: string;
odometerStart?: number;
odometerEnd?: number;
```

Update `addEntry` to:
- Accept odometer values
- Update vehicle's `last_recorded_odometer` when trip is saved (for reference)

---

### Validation

1. **End > Start** - End odometer must be greater than start
2. **Reasonable range** - Warn (not block) if jump is unusually large (>500 miles)
3. **Both required in odometer mode** - If using odometer mode, both fields must be filled

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useVehiclesDB.ts` | Vehicle CRUD operations and state |

### Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/AppSettingsContext.tsx` | Add `preferOdometerMode` setting |
| `src/hooks/useMileageDB.ts` | Add odometer fields to entry type |
| `src/pages/MileageTracker.tsx` | Add odometer mode toggle, vehicle selector, odometer inputs |
| `src/components/mobile/QuickMileageForm.tsx` | Add odometer mode for mobile |
| `src/pages/Settings.tsx` | Add vehicle management section |

### Database Migration
- Create `vehicles` table with RLS policies
- Add `vehicle_id`, `odometer_start`, `odometer_end` columns to `mileage_entries`

---

### Example Use Case

1. User selects "Work Van" as vehicle
2. User looks at their dashboard: odometer shows 45,276
3. User enters Start: 45,276
4. User selects "Collection Run - East Side" route (auto-fills locations/purpose)
5. User drives route
6. User enters End: 45,322
7. System calculates: **46 miles driven**
8. Entry saved with verifiable odometer readings
9. Vehicle's "last recorded" updated to 45,322 (for reference only)

---

### Tax Benefit

IRS-compliant mileage logs should include:
- Date of trip
- Start and end locations
- Business purpose
- Miles driven
- **Odometer readings** (recommended for verification)

This feature adds the odometer component that makes mileage logs audit-ready.

