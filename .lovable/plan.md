
## Maintenance Section Stability Improvements

This plan addresses the app freezing issue when logging in after a maintenance ticket is submitted. The fix involves making the maintenance data fetching more robust, improving error handling, and ensuring the app gracefully handles edge cases.

---

## Root Cause Analysis

After investigating the code, several potential issues were identified:

1. **Aggressive `!inner` Joins**: The `useMaintenanceReports` hook uses `!inner` joins which will fail if the related `location_machines` or `locations` records are missing/deleted
2. **Silent Error Handling**: Errors are caught but not surfaced to users, making debugging difficult
3. **No Loading State Check on Dashboard**: The Dashboard uses maintenance data without checking if it's loaded
4. **Missing RLS Filter**: The maintenance query doesn't filter by `user_id`, relying solely on RLS which could cause performance issues with large datasets

---

## Solution Overview

### 1. Make the Query More Resilient

Change from `!inner` joins (which require matching records) to regular joins (which allow null values):

**Current Query (problematic):**
```typescript
.select(`
  *,
  location_machines!inner(
    machine_type,
    custom_label,
    locations!inner(name)
  )
`)
```

**Fixed Query (resilient):**
```typescript
.select(`
  *,
  location_machines(
    machine_type,
    custom_label,
    locations(name)
  )
`)
.eq("user_id", user.id) // Explicit filter for better performance
```

### 2. Improve Error State Management

Add proper error state tracking and display:

```typescript
const [error, setError] = useState<string | null>(null);

// In fetchReports:
} catch (error: any) {
  console.error("Error fetching maintenance reports:", error);
  setError(error?.message || "Failed to load maintenance reports");
}
```

### 3. Handle Orphaned Reports Gracefully

Reports with deleted machines should show a fallback message rather than crashing:

```typescript
machine_type: report.location_machines?.machine_type || "Unknown Machine",
machine_label: report.location_machines?.custom_label,
location_name: report.location_machines?.locations?.name || "Unknown Location",
```

### 4. Add Loading State to Dashboard

Ensure the Dashboard doesn't render maintenance-dependent widgets until data is loaded:

```typescript
const { reports: maintenanceReports, isLoaded: maintenanceLoaded } = useMaintenanceReports();

// Include in isLoaded check
const isLoaded = locationsLoaded && entriesLoaded && inventoryLoaded && 
                 layoutLoaded && routesLoaded && schedulesLoaded && maintenanceLoaded;
```

### 5. Add Retry Mechanism

Add a retry button when errors occur so users can attempt to reload:

```typescript
{error && (
  <Card className="glass-card border-destructive/30">
    <CardContent className="py-6 text-center">
      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
      <p className="text-sm text-destructive">{error}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={refetch}>
        Try Again
      </Button>
    </CardContent>
  </Card>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useMaintenanceReports.ts` | Remove `!inner` joins, add user_id filter, add error state, improve null handling |
| `src/pages/Maintenance.tsx` | Display error state with retry option |
| `src/pages/Dashboard.tsx` | Wait for maintenance data before rendering dependent widgets |
| `src/components/maintenance/MaintenanceWidget.tsx` | Handle error state gracefully |

---

## Technical Changes

### useMaintenanceReports.ts

**Add error state:**
```typescript
const [error, setError] = useState<string | null>(null);
```

**Change the query:**
- Remove `!inner` from joins to allow null values
- Add explicit `.eq("user_id", user.id)` filter for performance
- Handle null values with fallbacks in data mapping

**Return error state:**
```typescript
return {
  reports,
  openReports,
  inProgressReports,
  resolvedReports,
  isLoaded,
  isLoading,
  error,
  refetch: fetchReports,
  updateReport,
  deleteReport,
};
```

### Maintenance.tsx

**Add error display:**
- Show an error card when data fails to load
- Include a "Try Again" button to retry fetching
- Preserve existing UI for when data loads successfully

### Dashboard.tsx

**Update loading check:**
- Include `maintenanceLoaded` in the `isLoaded` computation
- Safely handle the case where `maintenanceReports` might be undefined

---

## Additional Improvements

### Create Maintenance Report with Auth Check

For the `AddMaintenanceReportDialog` that operators use, add proper validation:
- Ensure the machine exists before submitting
- Show meaningful error messages on failure
- Prevent double-submissions with loading state

### Database Consideration

If orphaned reports become common, consider adding a database cleanup function or cascade delete rules. However, this is out of scope for the immediate fix.

---

## Testing Checklist

After implementation:
1. Submit a maintenance report via the public QR code page
2. Log in as the operator and verify the app loads without freezing
3. Navigate to the Maintenance page and verify reports display correctly
4. Delete a location with associated maintenance reports and verify the app still works
5. Test the "Try Again" button when simulating network errors

---

## Implementation Order

1. Update `useMaintenanceReports.ts` with resilient query and error handling
2. Update `Maintenance.tsx` with error display
3. Update `Dashboard.tsx` with proper loading state
4. Update `MaintenanceWidget.tsx` with error handling
5. Test the complete flow end-to-end
