import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MyPermissions {
  isLoading: boolean;
  isOwner: boolean;              // true if viewing own data (not a team member)
  isTeamMember: boolean;         // true if viewing as team member
  canViewRevenue: boolean;       // can see collections
  canViewDocuments: boolean;     // can see agreements/commissions
  canViewLocations: boolean;
  canViewMaintenance: boolean;
  canManageMaintenance: boolean;
  canViewInventory: boolean;
  canViewLeads: boolean;
  canViewReports: boolean;
  canViewMileage: boolean;       // can see routes/mileage
  canAssignTasks: boolean;       // can assign tasks to team members
}

const DEFAULT_OWNER_PERMISSIONS: MyPermissions = {
  isLoading: false,
  isOwner: true,
  isTeamMember: false,
  canViewRevenue: true,
  canViewDocuments: true,
  canViewLocations: true,
  canViewMaintenance: true,
  canManageMaintenance: true,
  canViewInventory: true,
  canViewLeads: true,
  canViewReports: true,
  canViewMileage: true,
  canAssignTasks: true,
};

const DEFAULT_RESTRICTED_PERMISSIONS: MyPermissions = {
  isLoading: false,
  isOwner: false,
  isTeamMember: true,
  canViewRevenue: false,
  canViewDocuments: false,
  canViewLocations: false,
  canViewMaintenance: false,
  canManageMaintenance: false,
  canViewInventory: false,
  canViewLeads: false,
  canViewReports: false,
  canViewMileage: false,
  canAssignTasks: false,
};

/**
 * Hook to fetch the current user's team membership and permissions.
 * 
 * If the user is not a team member on any account, they are treated as an owner
 * with full permissions. If they are a team member, their specific permissions
 * are fetched from the team_member_permissions table.
 */
export function useMyTeamPermissions(): MyPermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<MyPermissions>({
    ...DEFAULT_OWNER_PERMISSIONS,
    isLoading: true,
  });

  useEffect(() => {
    if (!user) {
      setPermissions({ ...DEFAULT_OWNER_PERMISSIONS, isLoading: false });
      return;
    }

    const fetchPermissions = async () => {
      try {
        // Check if the current user is a team member on any account
        // The RLS policy "Members can view their membership" allows this query
        const { data: teamMembership, error: memberError } = await supabase
          .from("team_members")
          .select("id, owner_user_id, status")
          .eq("member_user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (memberError) {
          console.error("Error fetching team membership:", memberError);
          // Default to owner permissions on error
          setPermissions(DEFAULT_OWNER_PERMISSIONS);
          return;
        }

        // If no team membership found, user is an owner with full access
        if (!teamMembership) {
          setPermissions(DEFAULT_OWNER_PERMISSIONS);
          return;
        }

        // User is a team member - fetch their specific permissions
        // The RLS policy "Members can view their own permissions" allows this
        const { data: permData, error: permError } = await supabase
          .from("team_member_permissions")
          .select("*")
          .eq("team_member_id", teamMembership.id)
          .maybeSingle();

        if (permError) {
          console.error("Error fetching team permissions:", permError);
          // Default to restricted permissions if we know they're a team member but can't get perms
          setPermissions(DEFAULT_RESTRICTED_PERMISSIONS);
          return;
        }

        // If no permissions record exists, treat as restricted
        if (!permData) {
          setPermissions(DEFAULT_RESTRICTED_PERMISSIONS);
          return;
        }

        // Build permissions object from database values
        setPermissions({
          isLoading: false,
          isOwner: false,
          isTeamMember: true,
          canViewRevenue: permData.can_view_revenue ?? false,
          canViewDocuments: permData.can_view_documents ?? false,
          canViewLocations: permData.can_view_locations ?? false,
          canViewMaintenance: permData.can_view_maintenance ?? false,
          canManageMaintenance: permData.can_manage_maintenance ?? false,
          canViewInventory: permData.can_view_inventory ?? false,
          canViewLeads: permData.can_view_leads ?? false,
          canViewReports: permData.can_view_reports ?? false,
          canViewMileage: permData.can_view_mileage ?? false,
          canAssignTasks: permData.can_assign_tasks ?? false,
        });
      } catch (error) {
        console.error("Unexpected error fetching permissions:", error);
        setPermissions(DEFAULT_OWNER_PERMISSIONS);
      }
    };

    fetchPermissions();
  }, [user]);

  return permissions;
}
