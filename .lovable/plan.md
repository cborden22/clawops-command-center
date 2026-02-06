

## Add Route Selection to Quick Mileage Form

This plan adds the ability to select a saved route in the Quick Add mileage form on mobile, matching the functionality available on the full mileage tracker page. When a route is selected, it auto-populates the From and To locations and makes the To field optional.

---

## Current State

The **QuickMileageForm** currently:
- Allows selecting a vehicle
- Has From/To location selectors (manual entry)
- Supports both Odometer and GPS tracking modes
- Requires both From and To locations

The **MileageTracker page** has a `RouteQuickSelector` component that:
- Shows saved routes in a dropdown
- Auto-populates From (first stop) and To (last stop) when a route is selected
- Makes the "To" location optional when a route is selected
- Sets the purpose to the route name

---

## Solution

Add the `RouteQuickSelector` component to the QuickMileageForm with the same behavior as the main mileage tracker page.

---

## Implementation Details

### Changes to QuickMileageForm.tsx

**1. Add new imports:**
```typescript
import { useRoutes, MileageRoute, RouteStop } from "@/hooks/useRoutesDB";
import { RouteQuickSelector } from "@/components/mileage/RouteQuickSelector";
```

**2. Add routes hook and state:**
```typescript
const { routes } = useRoutes();
const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
```

**3. Add helper function to convert route stops to location selections:**
```typescript
const stopToLocationSelection = (stop: RouteStop): LocationSelection => {
  if (stop.locationId) {
    return { type: "location", locationId: stop.locationId };
  }
  
  const customName = stop.customLocationName || "";
  
  // Check if this stop represents the warehouse
  if (customName === warehouseAddress || 
      customName.toLowerCase().includes("warehouse") ||
      customName.toLowerCase() === "starting point") {
    return { type: "warehouse" };
  }
  
  return { type: "custom", customName };
};
```

**4. Add route selection handler:**
```typescript
const handleRouteSelect = (route: MileageRoute | null) => {
  if (!route) {
    setSelectedRouteId(null);
    return;
  }
  
  setSelectedRouteId(route.id);
  
  // Auto-populate From and To from first and last stops
  const firstStop = route.stops[0];
  const lastStop = route.stops[route.stops.length - 1];
  
  if (firstStop) {
    setFromSelection(stopToLocationSelection(firstStop));
  }
  
  if (lastStop) {
    setToSelection(stopToLocationSelection(lastStop));
  }
  
  // Set purpose to route name
  setPurpose(route.name);
};
```

**5. Add handlers to clear route when From/To manually changed:**
```typescript
const handleFromChange = (selection: LocationSelection) => {
  setFromSelection(selection);
  if (selectedRouteId) setSelectedRouteId(null);
};

const handleToChange = (selection: LocationSelection) => {
  setToSelection(selection);
  if (selectedRouteId) setSelectedRouteId(null);
};
```

**6. Update validation in `handleStartTrip` and `handleStartGpsTracking`:**
```typescript
// If no route is selected, destination is required
if (!selectedRouteId && !endLocationStr) {
  toast({ title: "To Required", description: "Please select a route or enter a destination." });
  return;
}

// If route is selected, use route name as destination if To is empty
const selectedRoute = selectedRouteId ? routes.find(r => r.id === selectedRouteId) : null;
const finalEndLocation = endLocationStr || (selectedRoute ? `${selectedRoute.name} (Route)` : "");
```

**7. Update resetForm to clear route selection:**
```typescript
const resetForm = () => {
  setOdometerStart("");
  setOdometerEnd("");
  setPurpose("");
  setNotes("");
  setToSelection({ type: "location" });
  setSelectedRouteId(null);  // Add this
};
```

**8. Add RouteQuickSelector to the form UI (after TrackingModeSelector):**
```tsx
{/* Route Quick Selector */}
{routes.length > 0 && (
  <RouteQuickSelector
    routes={routes}
    selectedRouteId={selectedRouteId}
    onSelectRoute={handleRouteSelect}
    locations={activeLocations}
    warehouseAddress={warehouseAddress}
  />
)}
```

**9. Update LocationSelector usage to use the new handlers:**
```tsx
<LocationSelector
  type="from"
  value={fromSelection}
  onChange={handleFromChange}  // Changed from setFromSelection
  locations={activeLocations}
  warehouseAddress={warehouseAddress}
/>

<LocationSelector
  type="to"
  value={toSelection}
  onChange={handleToChange}  // Changed from setToSelection
  locations={activeLocations}
  warehouseAddress={warehouseAddress}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/mobile/QuickMileageForm.tsx` | Add route selection, auto-population, and updated validation |

---

## User Experience Flow

1. User opens Quick Add sheet and taps "Mileage" tab
2. If saved routes exist, a "Quick Start from Route" selector appears
3. User selects a route → From/To auto-populate, Purpose set to route name
4. User can still manually change From/To (this clears the route selection)
5. Start Trip/GPS Tracking works as before, but "To" is now optional if a route is selected

---

## Visual Layout (After Implementation)

```
[ Odometer | GPS ]                    ← Tracking Mode

┌─ Quick Start from Route ────────────┐
│  🗺 Select a saved route...         ▼│
│                                      │
│  Route stops: Warehouse → Shop A →  │
│  Est. 12.4 miles [Round Trip]       │
└──────────────────────────────────────┘

[ Vehicle Selector ]

[ From Location ]    ← Auto-filled from route

[ To Location ]      ← Auto-filled from route

[ Start Odometer ]   ← (odometer mode only)

[ Purpose ]          ← Auto-filled with route name

[ Notes (Optional) ]

[ Start Trip / Start GPS Tracking ]
```

