
## Route Auto-Import for Mileage Logging

This plan enhances the Routes section so that clicking on a saved route template automatically populates the trip logging form with the route's start and end locations, making it seamless to log trips using pre-defined routes.

---

## Current Problem

When users click "Use This Route" on a route template:
- Currently only the purpose field gets set to the route name
- The From and To locations are NOT populated
- Users have to manually re-select locations that are already defined in the route

---

## Solution Overview

### Two Ways to Start a Trip

**Option 1: Direct Location Selection** (existing, enhanced)
- Select From: Warehouse, Saved Location, or Custom Address
- Select To: Saved Location or Custom Address
- Works for one-off trips to specific locations

**Option 2: Use a Route Template** (new feature)
- Select a saved route from a dropdown in the Log Trip form
- Auto-populates From (first stop) and To (last stop)
- Shows route preview with all intermediate stops
- Pre-fills purpose with route name

---

## UI Changes

### Log Trip Tab - Add Route Selector

Add a "Quick Start" section at the top of the Log Trip form:

```text
+-----------------------------------------------+
|  Quick Start                                  |
+-----------------------------------------------+
|  [Select a route to auto-fill locations...]  |
|  ┌─────────────────────────────────────────┐ |
|  │ ▼ Monday Collection Route               │ |
|  └─────────────────────────────────────────┘ |
|                                               |
|  Route Preview:                               |
|  Warehouse → Joe's Bar → Pete's → Warehouse   |
|  (Est. 24.5 miles)                            |
+-----------------------------------------------+
```

When a route is selected:
1. From is set to first stop (e.g., Warehouse)
2. To is set to last stop (e.g., Warehouse for round trip, or final location)
3. Purpose is set to route name
4. A visual preview shows the full route path

### Route Cards - Enhanced "Use This Route" Button

When clicking "Use This Route" from the Templates tab:
1. Switch to Log Trip tab
2. Set selected route in the new route selector dropdown
3. Auto-populate all fields as described above

---

## Technical Implementation

### 1. New State in MileageTracker.tsx

```typescript
// Selected route template for quick-start
const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
const selectedRoute = selectedRouteId ? routes.find(r => r.id === selectedRouteId) : null;
```

### 2. Enhanced handleUseRoute Function

```typescript
const handleUseRoute = (route: MileageRoute) => {
  setActiveTab("log");
  setSelectedRouteId(route.id);
  
  // Get first and last stops
  const firstStop = route.stops[0];
  const lastStop = route.stops[route.stops.length - 1];
  
  // Set From location
  if (firstStop.locationId) {
    setFromSelection({ type: "location", locationId: firstStop.locationId });
  } else if (firstStop.customLocationName) {
    // Check if it matches warehouse
    if (firstStop.customLocationName === warehouseAddress || 
        firstStop.customLocationName.toLowerCase().includes("warehouse")) {
      setFromSelection({ type: "warehouse" });
    } else {
      setFromSelection({ type: "custom", customName: firstStop.customLocationName });
    }
  }
  
  // Set To location
  if (lastStop.locationId) {
    setToSelection({ type: "location", locationId: lastStop.locationId });
  } else if (lastStop.customLocationName) {
    setToSelection({ type: "custom", customName: lastStop.customLocationName });
  }
  
  // Set purpose to route name
  setPurpose(route.name);
};
```

### 3. New RouteQuickSelector Component

Create a new component for the route selector dropdown:

```typescript
// src/components/mileage/RouteQuickSelector.tsx

interface RouteQuickSelectorProps {
  routes: MileageRoute[];
  selectedRouteId: string | null;
  onSelect: (route: MileageRoute | null) => void;
  locations: Location[];
}

export function RouteQuickSelector({ routes, selectedRouteId, onSelect, locations }: RouteQuickSelectorProps) {
  // Renders:
  // - Dropdown with all route templates
  // - "Or enter locations manually" option to clear selection
  // - Route preview showing all stops when a route is selected
}
```

### 4. Helper Function for Stop-to-LocationSelection Conversion

```typescript
// Helper to convert a route stop to LocationSelection
const stopToLocationSelection = (
  stop: RouteStop,
  warehouseAddress: string
): LocationSelection => {
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

### 5. Clear Route Selection When Manual Changes Made

When user manually changes From/To fields after selecting a route:

```typescript
// When fromSelection or toSelection changes manually
const handleFromChange = (selection: LocationSelection) => {
  setFromSelection(selection);
  // If user is manually changing, clear the route selection
  if (selectedRouteId) {
    setSelectedRouteId(null);
  }
};
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/mileage/RouteQuickSelector.tsx` | New dropdown component for selecting route templates in the Log Trip form |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/MileageTracker.tsx` | Add selectedRouteId state, enhance handleUseRoute, add RouteQuickSelector to form, update from/to change handlers |
| `src/components/mileage/RouteManager.tsx` | Pass full MileageRoute to onUseRoute callback (already does this) |

---

## User Flow

### Using a Route Template

1. User opens Routes page (Log Trip tab is default)
2. User selects "Monday Collection" from the route dropdown
3. Form auto-fills:
   - From: Warehouse
   - To: Warehouse (or last stop if not round trip)
   - Purpose: "Monday Collection"
4. Route preview shows: Warehouse → Joe's Bar → Pete's Tavern → Mike's → Warehouse
5. User enters vehicle and start odometer
6. User clicks "Start Trip"

### Using a Route from Templates Tab

1. User opens Routes page, clicks "Templates" tab
2. User sees their saved route cards
3. User clicks "Use This Route" on "Monday Collection"
4. App switches to Log Trip tab with form pre-filled
5. Same as steps 4-6 above

### Manual Single-Location Trip

1. User opens Routes page
2. User leaves route dropdown empty (or clears it)
3. User manually selects:
   - From: Warehouse
   - To: Pete's Tavern (from saved locations)
4. User enters vehicle and start odometer
5. User clicks "Start Trip"

---

## Edge Cases

- **Route with 2 stops**: From = stop 1, To = stop 2 (straightforward)
- **Route with 5+ stops**: From = first stop, To = last stop, show all stops in preview
- **Route stop is deleted location**: Show "Unknown Location" and allow user to correct
- **User modifies From/To after selecting route**: Clear route selection (treated as manual entry)
- **Route with custom addresses**: Map to "custom" LocationSelection type

---

## Implementation Order

1. Add `selectedRouteId` state and helper functions to MileageTracker.tsx
2. Create RouteQuickSelector component with route dropdown and preview
3. Enhance handleUseRoute to populate From/To selections
4. Add RouteQuickSelector to the Log Trip form above the From/To fields
5. Update From/To change handlers to clear route selection when manually changed
6. Test both flows: direct route selection and "Use This Route" from Templates tab
