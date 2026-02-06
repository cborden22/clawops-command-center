
## Enhanced Routes Tracking: GPS Live Tracking + Simplified Manual Entry

This plan adds two distinct mileage tracking modes: **GPS Live Tracking** using the phone's geolocation, and a **Simplified Manual Mode** that streamlines the current odometer-based workflow with support for "in-progress" trips that auto-save.

---

## Overview

### Current State
- The mileage tracker requires entering both start AND end odometer readings upfront
- No GPS-based tracking capability
- No concept of "in-progress" trips that can be completed later
- Users cannot start a trip and update the end odometer after completing their route

### New Features

**Option 1: GPS Live Tracking**
- Start tracking when leaving, phone records distance using GPS
- Real-time distance display during the trip
- Auto-saves periodically to prevent data loss
- End tracking when done, miles are calculated automatically

**Option 2: Simplified Manual Mode**
- Select vehicle, from location, and destination (or select a saved route template)
- Enter start odometer only when beginning
- Trip saves immediately as "in-progress"
- Return later to enter end odometer and complete the trip
- Data auto-saves as you type

---

## Part 1: Database Changes

### New Columns for `mileage_entries` table

| Column | Type | Purpose |
|--------|------|---------|
| `status` | text | Track trip state: 'in_progress', 'completed' |
| `tracking_mode` | text | 'gps' or 'odometer' |
| `gps_distance_meters` | numeric | Raw GPS-calculated distance |
| `gps_start_lat` | numeric | Starting GPS latitude |
| `gps_start_lng` | numeric | Starting GPS longitude |
| `gps_end_lat` | numeric | Ending GPS latitude |
| `gps_end_lng` | numeric | Ending GPS longitude |
| `started_at` | timestamptz | When tracking started (for GPS mode) |
| `completed_at` | timestamptz | When trip was completed |

### Migration SQL
```sql
ALTER TABLE mileage_entries
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS tracking_mode text DEFAULT 'odometer',
ADD COLUMN IF NOT EXISTS gps_distance_meters numeric,
ADD COLUMN IF NOT EXISTS gps_start_lat numeric,
ADD COLUMN IF NOT EXISTS gps_start_lng numeric,
ADD COLUMN IF NOT EXISTS gps_end_lat numeric,
ADD COLUMN IF NOT EXISTS gps_end_lng numeric,
ADD COLUMN IF NOT EXISTS started_at timestamptz,
ADD COLUMN IF NOT EXISTS completed_at timestamptz;
```

---

## Part 2: GPS Live Tracking Hook

### New Hook: `useGpsTracking.ts`

Creates a React hook that wraps the browser's Geolocation API:

```typescript
interface GpsTrackingState {
  isTracking: boolean;
  distanceMeters: number;
  distanceMiles: number;
  currentPosition: { lat: number; lng: number } | null;
  startPosition: { lat: number; lng: number } | null;
  error: string | null;
  accuracy: number | null;
  elapsedTime: number; // seconds
}

function useGpsTracking() {
  // State management
  // Start tracking: navigator.geolocation.watchPosition()
  // Calculate distance using Haversine formula
  // Stop tracking: navigator.geolocation.clearWatch()
  // Auto-save every 30 seconds
}
```

**Key Features:**
- Uses `watchPosition()` for continuous GPS updates
- Calculates cumulative distance using Haversine formula
- Handles GPS errors gracefully (no signal, denied permission)
- Shows current accuracy level to user
- Battery-conscious: configurable update frequency

---

## Part 3: Simplified Manual Entry Flow

### Redesigned "Log Trip" Tab

Replace the current form with a two-phase flow:

**Phase 1: Start Trip**
```text
+-----------------------------------------------+
|  Start a Trip                                 |
+-----------------------------------------------+
|  [Mode: GPS Tracking ○ | Manual Odometer ●]  |
+-----------------------------------------------+
|  Vehicle *        [ My Work Van       ▼ ]    |
|  From *           [ Warehouse         ▼ ]    |
|  To *             [ Pete's Bar        ▼ ]    |
|                   -- OR --                   |
|  Use Route        [ Morning Route     ▼ ]    |
+-----------------------------------------------+
|  Start Odometer * [___45,276___]             |
|                                               |
|  Purpose          [ Collection Run    ▼ ]    |
+-----------------------------------------------+
|         [ Start Trip ]                        |
+-----------------------------------------------+
```

When user clicks "Start Trip":
- Create mileage entry with `status: 'in_progress'`
- Save start odometer, from/to locations, vehicle
- Show active trip card at top of page

**Phase 2: Complete Trip (Active Trip Card)**
```text
+-----------------------------------------------+
|  🚗 Active Trip                    [Discard]  |
+-----------------------------------------------+
|  Pete's Bar                                   |
|  Started: 2:30 PM                             |
|  Start Odometer: 45,276                       |
+-----------------------------------------------+
|  End Odometer *   [___45,298___]             |
|                                               |
|  Calculated:  22.0 miles                      |
|  Est. Deduction: $14.74                       |
+-----------------------------------------------+
|         [ Complete Trip ]                     |
+-----------------------------------------------+
```

**Key Behaviors:**
- Active trip persists even if app is closed (stored in database with status='in_progress')
- End odometer field auto-saves as user types (debounced)
- User can discard an active trip if they made a mistake
- Only one active trip at a time per vehicle

---

## Part 4: GPS Tracking Mode UI

When user selects "GPS Tracking" mode:

**Starting GPS Trip:**
```text
+-----------------------------------------------+
|  Start GPS Tracking                           |
+-----------------------------------------------+
|  Vehicle *        [ My Work Van       ▼ ]    |
|  From *           [ Warehouse         ▼ ]    |
|  To *             [ Pete's Bar        ▼ ]    |
|  Purpose          [ Collection Run    ▼ ]    |
+-----------------------------------------------+
|  📍 GPS Accuracy: High (5m)                   |
|                                               |
|         [ Start Tracking ]                    |
+-----------------------------------------------+
```

**Live Tracking Display:**
```text
+-----------------------------------------------+
|  🔴 Tracking Active                 [Stop]   |
+-----------------------------------------------+
|  Distance:     12.4 miles                     |
|  Est. Deduction: $8.31                        |
|  Duration:     0:23:45                        |
|                                               |
|  📍 Signal: Strong                            |
|     Accuracy: 8m                              |
+-----------------------------------------------+
|  Destination: Pete's Bar                      |
|                                               |
|         [ Complete & Save Trip ]              |
+-----------------------------------------------+
```

**GPS Error Handling:**
- Permission denied: Show settings instruction
- No GPS available: Fall back to manual mode
- Weak signal: Show warning, continue tracking
- Battery low: Reduce update frequency

---

## Part 5: Quick Add Integration

Update the mobile "Quick Add" sheet to support the new flow:

**Quick Mileage Form Changes:**
1. Add mode toggle (GPS vs Manual)
2. Support starting an "in-progress" trip
3. Add "Complete Active Trip" option if one exists
4. Auto-detect vehicle's last recorded odometer as default

---

## Part 6: Selecting a Route Template

When user selects a route template instead of manual from/to:

```text
+-----------------------------------------------+
|  Use Route Template                           |
+-----------------------------------------------+
|  [ Morning Route ▼ ]                          |
|                                               |
|  Stops: Warehouse → Joe's → Pete's → Mike's   |
|  Template Miles: 34.2 mi (RT)                 |
+-----------------------------------------------+
|  Start Odometer * [___45,276___]             |
|                                               |
|         [ Start Route ]                       |
+-----------------------------------------------+
```

When route is selected:
- Auto-populate From (first stop) and To (last stop)
- Pre-fill purpose with route name
- Link entry to `route_id` in database

---

## Implementation Files

### New Files
| File | Purpose |
|------|---------|
| `src/hooks/useGpsTracking.ts` | GPS tracking hook with Haversine distance calculation |
| `src/hooks/useActiveTrip.ts` | Manage in-progress trip state |
| `src/components/mileage/GpsTracker.tsx` | Live GPS tracking UI component |
| `src/components/mileage/ActiveTripCard.tsx` | Active trip completion card |
| `src/components/mileage/TrackingModeSelector.tsx` | Toggle between GPS/Manual modes |

### Modified Files
| File | Changes |
|------|---------|
| `src/hooks/useMileageDB.ts` | Add status field, update/complete in-progress entries |
| `src/pages/MileageTracker.tsx` | Redesign Log Trip tab with two-phase flow, add GPS mode |
| `src/components/mobile/QuickMileageForm.tsx` | Add mode toggle, support in-progress trips |

---

## Technical Details

### Haversine Distance Formula
```typescript
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

### GPS Tracking Options
```typescript
const gpsOptions: PositionOptions = {
  enableHighAccuracy: true,  // Use GPS (not WiFi/cell)
  timeout: 10000,            // 10 second timeout
  maximumAge: 5000,          // Accept 5-second-old position
};
```

### Auto-Save Strategy
- **GPS Mode**: Save accumulated distance every 30 seconds
- **Manual Mode**: Debounce save end odometer (1 second delay)
- **Both**: Final save on "Complete Trip" action

---

## User Flow Summary

### Quick Single-Location Trip
1. Open Routes page or Quick Add
2. Select vehicle (auto-fills last odometer)
3. Choose "To" location
4. Enter current odometer reading
5. Click "Start Trip" - saves immediately as in-progress
6. After visiting location, enter end odometer
7. Click "Complete Trip" - calculates and saves miles

### Full Route with GPS
1. Select "GPS Tracking" mode
2. Select vehicle and route template
3. Grant GPS permission if needed
4. Click "Start Tracking"
5. Drive your route - watch miles accumulate
6. Click "Complete & Save Trip" when done

### Resume In-Progress Trip
1. Open Routes page
2. See "Active Trip" card at top
3. Enter end odometer
4. Click "Complete Trip"

---

## Implementation Order

1. **Database migration** - Add new columns for status, tracking_mode, GPS data
2. **Update useMileageDB hook** - Support in-progress entries, new fields
3. **Create useActiveTrip hook** - Fetch/manage current in-progress trip
4. **Build ActiveTripCard component** - UI for completing trips
5. **Redesign MileageTracker Log Trip tab** - Two-phase manual flow
6. **Create useGpsTracking hook** - GPS tracking logic
7. **Build GpsTracker component** - Live tracking UI
8. **Add TrackingModeSelector** - Mode toggle component
9. **Integrate GPS mode** - Connect GPS UI to mileage tracker
10. **Update QuickMileageForm** - Support both modes on mobile
11. **Add route template selection** - Pre-fill from saved routes

---

## Edge Cases Handled

- **App closed during tracking**: GPS mode stops tracking, in-progress trip can be completed manually
- **No GPS permission**: Fall back to manual mode with explanation
- **Weak GPS signal**: Show warning, continue tracking with degraded accuracy
- **Multiple vehicles**: Only one active trip per vehicle at a time
- **Invalid odometer**: Validate end > start, show clear error
- **Discard trip**: Allow user to delete in-progress trip if made in error
