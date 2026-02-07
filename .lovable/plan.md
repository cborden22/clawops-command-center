
## Team Role Management Enhancement Plan

### Problem Summary

Currently, when a team member has already been invited to the workspace, the owner can only toggle between "Manager" and "Technician" roles. The new roles (Supervisor, Route Driver, Inventory Clerk, Sales Manager) that were added to the invite dialog are not accessible for existing members. Additionally, the permissions dialog is missing new permission fields.

---

### Issues Identified

| Issue | Location | Current State |
|-------|----------|---------------|
| Role toggle is limited | TeamMemberCard.tsx (line 156-165) | Only toggles between Manager/Technician |
| Type definition is wrong | TeamMemberCard.tsx (line 39) | `onUpdateRole` typed for 2 roles only |
| Missing role colors | TeamMemberCard.tsx (line 88-92) | No colors for new roles |
| Missing permissions | MemberPermissionsDialog.tsx | No UI for `can_view_mileage`, `can_assign_tasks` |
| Permissions state sync | MemberPermissionsDialog.tsx | Initial state not synced when dialog opens |

---

### Solution

#### 1. Create a Role Selector Dialog Component

Replace the simple toggle with a proper role selection dialog that:
- Shows all available roles with descriptions
- Applies role preset permissions when changed (optionally)
- Matches the style of the InviteMemberDialog role selector

**New component: `ChangeRoleDialog.tsx`**

```text
+--------------------------------------------------+
| Change Role                                       |
| Select a new role for user@example.com           |
+--------------------------------------------------+
|                                                  |
| [Select Role]                                    |
|   > Technician - Field work, maintenance...     |
|   > Manager - Full access to most features      |
|   > Supervisor - Manager access + assign tasks  |
|   > Route Driver - Mileage and routes only      |
|   > Inventory Clerk - Inventory management only |
|   > Sales Manager - Leads and locations focus   |
|                                                  |
| [ ] Apply role preset permissions               |
|                                                  |
|         [Cancel]        [Save Changes]          |
+--------------------------------------------------+
```

#### 2. Update TeamMemberCard

- Replace the "Change to Manager/Technician" menu item with "Change Role" that opens the new dialog
- Add color styles for all roles
- Update the type definition to accept all role types

**Changes to TeamMemberCard.tsx:**
- Import and use the new `ChangeRoleDialog`
- Add state for showing the role dialog
- Update `roleColors` to include all 7 roles:
  ```typescript
  const roleColors = {
    owner: "bg-primary text-primary-foreground",
    manager: "bg-blue-500/20 text-blue-600",
    technician: "bg-green-500/20 text-green-600",
    supervisor: "bg-purple-500/20 text-purple-600",
    route_driver: "bg-orange-500/20 text-orange-600",
    inventory_clerk: "bg-cyan-500/20 text-cyan-600",
    sales_manager: "bg-pink-500/20 text-pink-600",
  };
  ```

#### 3. Update MemberPermissionsDialog

Add the missing permission toggles:
- **Mileage** - View routes and mileage entries
- **Task Assignment** - Can assign tasks to other team members (for Supervisor role)

Also sync the initial state when the dialog opens (currently state is not reset when viewing different members).

#### 4. Update Type Definitions

Update the `onUpdateRole` prop type to accept all role types:
```typescript
onUpdateRole: (memberId: string, role: TeamRole, applyPreset?: boolean) => Promise<boolean>;
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/team/ChangeRoleDialog.tsx` | Dialog for selecting and changing team member roles |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/team/TeamMemberCard.tsx` | Add role dialog, update colors, fix types |
| `src/components/team/MemberPermissionsDialog.tsx` | Add mileage + task assignment toggles, fix state sync |
| `src/hooks/useTeamMembers.ts` | Update `updateMemberRole` to optionally apply preset permissions |

---

### Role Presets Reference

When a role is changed with "Apply preset permissions" enabled, these permissions will be set:

| Role | Locations | Maintenance | Manage Maint. | Inventory | Revenue | Leads | Reports | Documents | Mileage | Tasks |
|------|-----------|-------------|---------------|-----------|---------|-------|---------|-----------|---------|-------|
| Technician | Yes | Yes | Yes | Yes | No | No | No | No | No | No |
| Manager | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Supervisor | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Route Driver | Yes | No | No | No | No | No | No | No | Yes | No |
| Inventory Clerk | No | No | No | Yes | No | No | No | No | No | No |
| Sales Manager | Yes | No | No | No | No | Yes | Yes | Yes | No | No |

---

### Implementation Details

#### ChangeRoleDialog Component Structure

```tsx
interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  onSave: (role: TeamRole, applyPreset: boolean) => Promise<boolean>;
}

// Component will:
// 1. Show current role
// 2. Allow selecting new role from dropdown
// 3. Have checkbox "Apply role preset permissions"
// 4. Call onSave with selected role and preset flag
```

#### Updated updateMemberRole Function

```typescript
const updateMemberRole = async (
  memberId: string,
  role: TeamRole,
  applyPreset: boolean = false
): Promise<boolean> => {
  try {
    // Update the role
    await supabase.from("team_members").update({ role });

    // If applyPreset is true, update permissions based on role
    if (applyPreset) {
      await supabase.from("team_member_permissions").update(ROLE_PRESETS[role]);
    }

    // Refetch and show success
  }
};
```

---

### Expected Behavior After Implementation

| Action | Result |
|--------|--------|
| Click "Change Role" in member menu | Opens role selection dialog |
| Select a new role | Shows role description, enables save |
| Check "Apply preset permissions" | When saved, also updates permissions to match role |
| Save without applying preset | Only role label changes, permissions stay same |
| View permissions dialog | Shows all 10 permission toggles including mileage and tasks |

---

### Verification Checklist

1. All 6 non-owner roles visible in role selector
2. Role colors display correctly for all roles
3. Mileage permission toggle visible in permissions dialog
4. Task assignment permission toggle visible in permissions dialog
5. Changing role without preset keeps existing permissions
6. Changing role with preset applies correct permissions
7. Navigation filtering respects mileage permission
8. Team page accessible only by owners
