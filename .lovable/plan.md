

## Hide Navigation Menu Items Based on Team Member Permissions

### Problem Summary

When an account owner restricts a team member's access to certain features (e.g., Revenue, Leads, Reports), the corresponding **navigation menu items still appear** in both:
1. **Desktop Sidebar** (`AppSidebar.tsx`)
2. **Mobile Bottom Nav** (`MobileBottomNav.tsx`)

Team members can still see all menu options even if they don't have permission to access those pages. While RLS protects the data at the database level, the UI should also hide inaccessible options for a better user experience.

### Solution

Integrate the existing `useMyTeamPermissions` hook into both navigation components to:
1. Filter menu items based on the user's permissions
2. Hide entire menu sections if no items within are accessible
3. Keep the "Team" section hidden for team members (only owners manage teams)

---

### Permission to Route Mapping

| Route | Permission Required |
|-------|---------------------|
| `/` (Dashboard) | Always visible |
| `/leads` | `canViewLeads` |
| `/locations` | `canViewLocations` |
| `/maintenance` | `canViewMaintenance` |
| `/mileage` | Always visible (mileage is personal tracking) |
| `/inventory` | `canViewInventory` |
| `/revenue` | `canViewRevenue` |
| `/reports` | `canViewReports` |
| `/commission-summary` | `canViewDocuments` |
| `/documents` | `canViewDocuments` |
| `/receipts` | `canViewRevenue` (receipts are tied to revenue) |
| `/team` | `isOwner` only |
| `/settings` | Always visible |

---

### Technical Implementation

#### 1. Modify `AppSidebar.tsx`

Add permission-based filtering to the sidebar navigation:

```typescript
import { useMyTeamPermissions } from "@/hooks/useMyTeamPermissions";

export function AppSidebar() {
  const permissions = useMyTeamPermissions();
  
  // Filter operations items based on permissions
  const filteredOperationsItems = operationsItems.filter(item => {
    if (item.url === "/leads") return permissions.isOwner || permissions.canViewLeads;
    if (item.url === "/locations") return permissions.isOwner || permissions.canViewLocations;
    if (item.url === "/maintenance") return permissions.isOwner || permissions.canViewMaintenance;
    if (item.url === "/inventory") return permissions.isOwner || permissions.canViewInventory;
    if (item.url === "/mileage") return true; // Always visible
    return true;
  });
  
  // Filter financials items based on permissions
  const filteredFinancialsItems = financialsItems.filter(item => {
    if (item.url === "/revenue") return permissions.isOwner || permissions.canViewRevenue;
    if (item.url === "/reports") return permissions.isOwner || permissions.canViewReports;
    if (item.url === "/commission-summary") return permissions.isOwner || permissions.canViewDocuments;
    if (item.url === "/documents") return permissions.isOwner || permissions.canViewDocuments;
    return true;
  });
  
  // Management section only visible to owners
  const showManagement = permissions.isOwner;
  
  // Only render sections if they have items
  const showOperations = filteredOperationsItems.length > 0;
  const showFinancials = filteredFinancialsItems.length > 0;
  
  // ... render filtered items instead of full lists
}
```

#### 2. Modify `MobileBottomNav.tsx`

Apply the same filtering logic to mobile navigation:

```typescript
import { useMyTeamPermissions } from "@/hooks/useMyTeamPermissions";

export function MobileBottomNav({ onQuickAddOpen }: MobileBottomNavProps) {
  const permissions = useMyTeamPermissions();
  
  // Filter main tabs (bottom bar)
  const filteredMainTabs = mainTabs.filter(tab => {
    if (tab.path === "/revenue") return permissions.isOwner || permissions.canViewRevenue;
    if (tab.path === "/inventory") return permissions.isOwner || permissions.canViewInventory;
    return true; // Dashboard, Add, More always visible
  });
  
  // Filter operations items in More menu
  const filteredOperationsItems = operationsItems.filter(item => {
    if (item.path === "/leads") return permissions.isOwner || permissions.canViewLeads;
    if (item.path === "/locations") return permissions.isOwner || permissions.canViewLocations;
    if (item.path === "/maintenance") return permissions.isOwner || permissions.canViewMaintenance;
    if (item.path === "/inventory") return permissions.isOwner || permissions.canViewInventory;
    if (item.path === "/mileage") return true;
    return true;
  });
  
  // Filter financials items in More menu
  const filteredFinancialsItems = financialsItems.filter(item => {
    if (item.path === "/revenue") return permissions.isOwner || permissions.canViewRevenue;
    if (item.path === "/reports") return permissions.isOwner || permissions.canViewReports;
    if (item.path === "/receipts") return permissions.isOwner || permissions.canViewRevenue;
    if (item.isDocuments) return permissions.isOwner || permissions.canViewDocuments;
    return true;
  });
  
  // Conditionally hide entire sections in More menu
  const showOperationsSection = filteredOperationsItems.length > 0;
  const showFinancialsSection = filteredFinancialsItems.length > 0;
  
  // ... render filtered items
}
```

#### 3. Handle Loading State

While permissions are loading, show a minimal skeleton or the full menu (to prevent flash of content). Use `permissions.isLoading` to handle this gracefully:

```typescript
// Option: Show loading skeleton for nav items while permissions load
if (permissions.isLoading) {
  return <SidebarSkeleton />;
}
```

Or simply wait until permissions are loaded before filtering.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/AppSidebar.tsx` | Add `useMyTeamPermissions` hook, filter nav items based on permissions |
| `src/components/layout/MobileBottomNav.tsx` | Add `useMyTeamPermissions` hook, filter main tabs and More menu items |

---

### Edge Cases

1. **Loading state**: While permissions load, show all items or a skeleton to prevent layout shift
2. **Empty sections**: If a filtered section has zero items, hide the section header entirely
3. **Active route on hidden item**: If user is on a restricted route and gets permissions revoked, they see the page but navigation doesn't highlight it (data is still protected by RLS)

---

### Expected Behavior After Implementation

| Scenario | Result |
|----------|--------|
| Owner views navigation | All items visible, including Team management |
| Team member with no `canViewRevenue` | Revenue Tracker, Receipts hidden from nav |
| Team member with no `canViewDocuments` | Agreement Generator, Commission Summary hidden |
| Team member with no `canViewLeads` | Leads hidden from nav |
| Team member with full permissions | All items visible EXCEPT Team management |

