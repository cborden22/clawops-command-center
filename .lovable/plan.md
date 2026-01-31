
## Routes Tracker - Odometer-Only with Smart Location Selection

### Status: ✅ Implemented

### Overview
The Mileage Tracker has been redesigned into a streamlined **Routes** section with odometer-only tracking and smart location dropdowns.

---

### What Changed

| Before | After |
|--------|-------|
| "Mileage Tracker" | "Routes" |
| Manual miles OR odometer mode | Odometer-only (required) |
| Round trip toggle | Removed (odometer captures actual miles) |
| Free-text "From" field | Dropdown: Warehouse, Locations, or Custom |
| Free-text "To" field | Dropdown: Locations or Custom |
| Odometer mode is optional toggle | Odometer is the only mode |
| `preferOdometerMode` setting | Removed (no longer needed) |

---

### Files Modified

- `src/components/layout/AppSidebar.tsx` - Renamed to "Routes"
- `src/components/layout/MobileBottomNav.tsx` - Renamed to "Routes"
- `src/pages/MileageTracker.tsx` - Complete redesign
- `src/components/mobile/QuickMileageForm.tsx` - Simplified to odometer-only
- `src/contexts/AppSettingsContext.tsx` - Removed `preferOdometerMode`

### Files Created

- `src/components/mileage/LocationSelector.tsx` - Reusable location dropdown

### Files Deleted

- `src/components/mileage/OdometerModeInputs.tsx` - No longer needed

---

### Validation Rules

1. Vehicle Required
2. From Required (warehouse, location, or custom)
3. To Required (location or custom)
4. Odometer Start Required
5. Odometer End Required
6. End > Start validation
7. Large Jump Warning (>500 miles)
