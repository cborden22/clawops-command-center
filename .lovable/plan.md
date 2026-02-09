
## Three Fixes: Dashboard Permissions, Role Definitions, and Commission Double-Counting

---

### Issue 1: Commission Double-Counting in Reports

**Root Cause Found**

When a commission summary is generated, the system creates a "Commission Payout" expense in the `revenue_entries` table (see `CommissionSummaryGenerator.tsx` line 279). In the Reports section, the `locationPerformance` calculation in `useReportsData.ts` (lines 203-225) does this:

```
profit = income - expenses - commissions
```

The problem: `expenses` already includes the "Commission Payout" expense entry from `revenue_entries`, AND `commissions` separately adds the amount from `commission_summaries`. The same commission amount is subtracted twice.

**Fix**: In `useReportsData.ts`, exclude "Commission Payout" expenses from the `expenses` calculation in `locationPerformance` since commissions are already accounted for separately. This applies to both the per-location profit calculation AND the `financialSummary` calculation.

**Changes to `src/hooks/useReportsData.ts`**:
- In `locationPerformance` (line 210-212): Filter out expenses where `category === "Commission Payout"` from the expenses sum
- In `financialSummary` (line 259-282): Add a separate `commissionPayouts` amount and adjust `netProfit` to not double-count, OR simply exclude "Commission Payout" from expenses and let the location-level commission handle it
- The cleanest approach: exclude "Commission Payout" from the expenses total in locationPerformance only (since that's where commissions are separately tracked), and keep financialSummary as-is (since it only counts revenue_entries, not commission_summaries)

Specifically for `locationPerformance`:
```typescript
const expenses = locRevenue
  .filter(e => e.type === "expense" && e.category !== "Commission Payout")
  .reduce((sum, e) => sum + Number(e.amount), 0);
```

---

### Issue 2: Dashboard Permission Enforcement for Team Members

**Current State**: The Dashboard already filters widgets based on permissions (lines 114-130 in Dashboard.tsx). However, there are gaps:

- The `primaryStats` widget shows financial data (Month Income, Net Profit) regardless of permissions
- The `quickActions` widget may show links to unauthorized pages
- The `weeklyCalendar` widget shows all task types regardless of permissions

**Fix in `src/pages/Dashboard.tsx`**:

1. **Primary Stats widget**: Conditionally show/hide stat cards based on permissions
   - "Active Locations" card: show only if `canViewLocations`
   - "Month Income" card: show only if `canViewRevenue`
   - "Net Profit" card: show only if `canViewRevenue`
   - "Inventory" card: show only if `canViewInventory`

2. **Quick Actions widget**: Filter action links based on permissions (hide "Add Revenue", "Add Location", etc. if no permission)

3. **Weekly Calendar widget**: Filter task types based on permissions (hide maintenance tasks if no `canViewMaintenance`, etc.)

---

### Issue 3: Defined Roles and Route-Level Permission Guards

**Current Roles** (already defined in `useTeamMembers.ts`):

| Role | Locations | Maintenance | Inventory | Revenue | Leads | Reports | Documents | Mileage | Assign Tasks |
|------|-----------|-------------|-----------|---------|-------|---------|-----------|---------|-------------|
| Supervisor | Yes | Yes (manage) | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Sales Manager | Yes | No | No | No | Yes | Yes | Yes | No | No |
| Route Driver | Yes | No | No | No | No | No | No | Yes | No |
| Inventory Clerk | No | No | Yes | No | No | No | No | No | No |
| Technician | Yes | Yes (manage) | Yes | No | No | No | No | No | No |
| Manager | Yes | Yes (manage) | Yes | Yes | Yes | Yes | Yes | Yes | No |

These are already well-defined. The gap is that **route-level guards are missing** -- a team member can still navigate directly to `/revenue`, `/reports`, etc. via URL even if they don't have permission.

**Fix in `src/App.tsx`**: Create a `PermissionGuard` component that wraps protected routes and redirects unauthorized team members back to the dashboard.

```typescript
function PermissionGuard({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode; 
  requiredPermission: keyof MyPermissions;
}) {
  const permissions = useMyTeamPermissions();
  
  if (permissions.isLoading) return <LoadingSpinner />;
  if (permissions.isOwner) return <>{children}</>;
  if (!permissions[requiredPermission]) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}
```

Then wrap routes:
- `/locations` requires `canViewLocations`
- `/leads` requires `canViewLeads`
- `/maintenance` requires `canViewMaintenance`
- `/inventory` requires `canViewInventory`
- `/revenue` requires `canViewRevenue`
- `/reports` requires `canViewReports`
- `/documents` requires `canViewDocuments`
- `/commission-summary` requires `canViewDocuments`
- `/mileage` requires `canViewMileage`
- `/team` requires `isOwner` (already handled by sidebar, but needs route guard)

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useReportsData.ts` | Exclude "Commission Payout" from location expenses to fix double-counting |
| `src/pages/Dashboard.tsx` | Permission-gate individual stat cards and quick action links |
| `src/App.tsx` | Add `PermissionGuard` component and wrap protected routes |

---

### Summary of Changes

1. **One-line fix** for commission double-counting (filter out "Commission Payout" from location expenses)
2. **Dashboard hardening** so team members only see stats they have access to
3. **Route-level guards** so team members can't bypass navigation restrictions via direct URL access
