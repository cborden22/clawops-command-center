

## Fix Team Member Permission Visibility in Location Details

### Problem Summary

When a team member is granted access to view locations, they can currently see **all tabs** in the Location Detail Dialog:
- Collections (should require `can_view_revenue` permission)
- Agreements (should require `can_view_documents` permission)
- Commissions (should require `can_view_documents` permission)

The RLS policies correctly restrict data access at the database level, but the **frontend UI doesn't hide these tabs** based on the user's actual permissions.

### Root Cause

There's no mechanism in the frontend to:
1. Detect if the current user is a team member (subuser) vs. account owner
2. Fetch and check the current user's team permissions
3. Conditionally show/hide UI elements based on those permissions

### Solution

Create a new hook `useMyTeamPermissions` that:
1. Checks if the current user is a team member on any account
2. Fetches their permissions from `team_member_permissions` table
3. Provides permission flags that components can use

Then modify `LocationDetailDialog.tsx` to conditionally render tabs based on permissions.

---

### Technical Implementation

#### 1. New Hook: `useMyTeamPermissions.ts`

Creates a hook that fetches the current user's team membership and permissions:

```typescript
// src/hooks/useMyTeamPermissions.ts
export interface MyPermissions {
  isOwner: boolean;              // true if viewing own data
  isTeamMember: boolean;         // true if viewing as team member
  canViewRevenue: boolean;       // can see collections
  canViewDocuments: boolean;     // can see agreements/commissions
  canViewLocations: boolean;
  canViewMaintenance: boolean;
  canManageMaintenance: boolean;
  canViewInventory: boolean;
  canViewLeads: boolean;
  canViewReports: boolean;
}

export function useMyTeamPermissions() {
  // Query team_members where member_user_id = auth.uid()
  // If found, fetch corresponding team_member_permissions
  // If not found, user is owner with full permissions
  // Return permissions object
}
```

**Key Logic:**
- If no team membership exists for current user → they're an owner → all permissions = true
- If team membership exists → fetch permissions from `team_member_permissions`
- Permissions map:
  - Collections tab → `canViewRevenue` 
  - Agreements tab → `canViewDocuments`
  - Commissions tab → `canViewDocuments`

#### 2. Modify `LocationDetailDialog.tsx`

Update the dialog to conditionally render tabs:

**Before:**
```tsx
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="details">Details</TabsTrigger>
  <TabsTrigger value="collections">Collections</TabsTrigger>
  <TabsTrigger value="agreements">Agreements</TabsTrigger>
  <TabsTrigger value="commissions">Commissions</TabsTrigger>
</TabsList>
```

**After:**
```tsx
const { canViewRevenue, canViewDocuments, isOwner } = useMyTeamPermissions();

// Calculate visible tab count for grid layout
const visibleTabCount = 1 + 
  (isOwner || canViewRevenue ? 1 : 0) + 
  (isOwner || canViewDocuments ? 2 : 0);

<TabsList className={`grid w-full grid-cols-${visibleTabCount}`}>
  <TabsTrigger value="details">Details</TabsTrigger>
  
  {/* Collections - requires revenue permission */}
  {(isOwner || canViewRevenue) && (
    <TabsTrigger value="collections">Collections</TabsTrigger>
  )}
  
  {/* Agreements - requires documents permission */}
  {(isOwner || canViewDocuments) && (
    <TabsTrigger value="agreements">Agreements</TabsTrigger>
  )}
  
  {/* Commissions - requires documents permission */}
  {(isOwner || canViewDocuments) && (
    <TabsTrigger value="commissions">Commissions</TabsTrigger>
  )}
</TabsList>
```

Also conditionally render the corresponding `TabsContent` components to prevent rendering hidden data.

---

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useMyTeamPermissions.ts` | Create | Hook to fetch current user's team permissions |
| `src/components/LocationDetailDialog.tsx` | Modify | Conditionally show/hide tabs based on permissions |

### Permission Mapping

| UI Element | Required Permission |
|------------|---------------------|
| Collections tab | `can_view_revenue` |
| Agreements tab | `can_view_documents` |
| Commissions tab | `can_view_documents` |
| Details tab | Always visible (if `can_view_locations` is true, they have access) |

### Edge Cases

1. **Owner viewing own data**: All permissions = true (bypass checks)
2. **Team member with no permissions record**: Treat as restricted (default false)
3. **User is both owner AND team member on different accounts**: Check context - are they viewing their own data or someone else's?

### Data Flow

```
User opens Location Detail Dialog
        ↓
useMyTeamPermissions() hook runs
        ↓
Query: SELECT * FROM team_members WHERE member_user_id = auth.uid()
        ↓
If found → Fetch team_member_permissions
If not found → User is owner (full access)
        ↓
Return permissions object
        ↓
LocationDetailDialog uses permissions to conditionally render tabs
```

---

### Testing Checklist

After implementation:
1. As **owner**: Verify all 4 tabs visible in Location Detail Dialog
2. As **team member with `can_view_documents=false`**: Verify Agreements and Commissions tabs are hidden
3. As **team member with `can_view_revenue=false`**: Verify Collections tab is hidden
4. As **team member with both permissions disabled**: Verify only Details tab is visible

