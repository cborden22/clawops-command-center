import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface TeamMember {
  id: string;
  owner_user_id: string;
  member_user_id: string | null;
  role: "owner" | "manager" | "technician";
  status: "pending" | "active" | "deactivated";
  invited_email: string;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  permissions?: TeamMemberPermissions;
}

export interface TeamMemberPermissions {
  id: string;
  team_member_id: string;
  can_view_revenue: boolean;
  can_view_inventory: boolean;
  can_view_locations: boolean;
  can_view_maintenance: boolean;
  can_manage_maintenance: boolean;
  can_view_leads: boolean;
  can_view_reports: boolean;
  can_view_documents: boolean;
}

export interface InviteData {
  email: string;
  role: "manager" | "technician";
  permissions: Partial<TeamMemberPermissions>;
}

export function useTeamMembers() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  const fetchTeamMembers = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch team members where current user is the owner
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });

      if (membersError) throw membersError;

      // Fetch permissions for each member
      const membersWithPermissions: TeamMember[] = [];
      
      for (const member of members || []) {
        const { data: permissions } = await supabase
          .from("team_member_permissions")
          .select("*")
          .eq("team_member_id", member.id)
          .single();

        membersWithPermissions.push({
          ...member,
          role: member.role as "owner" | "manager" | "technician",
          status: member.status as "pending" | "active" | "deactivated",
          permissions: permissions || undefined,
        });
      }

      setTeamMembers(membersWithPermissions);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast({
        title: "Error",
        description: "Failed to load team members.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const inviteTeamMember = async (inviteData: InviteData): Promise<boolean> => {
    if (!user) return false;

    setIsInviting(true);
    try {
      // Check if already invited
      const { data: existing } = await supabase
        .from("team_members")
        .select("id")
        .eq("owner_user_id", user.id)
        .eq("invited_email", inviteData.email.toLowerCase())
        .single();

      if (existing) {
        toast({
          title: "Already Invited",
          description: "This email has already been invited to your team.",
          variant: "destructive",
        });
        return false;
      }

      // Create team member record
      const { data: newMember, error: memberError } = await supabase
        .from("team_members")
        .insert({
          owner_user_id: user.id,
          invited_email: inviteData.email.toLowerCase(),
          role: inviteData.role,
          status: "pending",
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // Create permissions record
      const { error: permError } = await supabase
        .from("team_member_permissions")
        .insert({
          team_member_id: newMember.id,
          can_view_revenue: inviteData.permissions.can_view_revenue ?? false,
          can_view_inventory: inviteData.permissions.can_view_inventory ?? true,
          can_view_locations: inviteData.permissions.can_view_locations ?? true,
          can_view_maintenance: inviteData.permissions.can_view_maintenance ?? true,
          can_manage_maintenance: inviteData.permissions.can_manage_maintenance ?? true,
          can_view_leads: inviteData.permissions.can_view_leads ?? false,
          can_view_reports: inviteData.permissions.can_view_reports ?? false,
          can_view_documents: inviteData.permissions.can_view_documents ?? false,
        });

      if (permError) throw permError;

      // Send invite email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-team-invite", {
        body: {
          email: inviteData.email.toLowerCase(),
          role: inviteData.role,
          inviter_name: user.user_metadata?.full_name || user.email,
        },
      });

      if (emailError) {
        console.warn("Failed to send invite email:", emailError);
        // Don't fail the invite if email fails
      }

      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${inviteData.email}.`,
      });

      await fetchTeamMembers();
      return true;
    } catch (error) {
      console.error("Error inviting team member:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsInviting(false);
    }
  };

  const updateMemberPermissions = async (
    memberId: string,
    permissions: Partial<TeamMemberPermissions>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("team_member_permissions")
        .update({
          ...permissions,
          updated_at: new Date().toISOString(),
        })
        .eq("team_member_id", memberId);

      if (error) throw error;

      toast({
        title: "Permissions Updated",
        description: "Team member permissions have been updated.",
      });

      await fetchTeamMembers();
      return true;
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateMemberRole = async (
    memberId: string,
    role: "manager" | "technician"
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: "Team member role has been updated.",
      });

      await fetchTeamMembers();
      return true;
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeMember = async (memberId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member Removed",
        description: "Team member has been removed.",
      });

      await fetchTeamMembers();
      return true;
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member.",
        variant: "destructive",
      });
      return false;
    }
  };

  const resendInvite = async (memberId: string, email: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.functions.invoke("send-team-invite", {
        body: {
          email,
          inviter_name: user.user_metadata?.full_name || user.email,
        },
      });

      if (error) throw error;

      toast({
        title: "Invitation Resent",
        description: `A new invitation has been sent to ${email}.`,
      });

      return true;
    } catch (error) {
      console.error("Error resending invite:", error);
      toast({
        title: "Error",
        description: "Failed to resend invitation.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    teamMembers,
    isLoading,
    isInviting,
    inviteTeamMember,
    updateMemberPermissions,
    updateMemberRole,
    removeMember,
    resendInvite,
    refetch: fetchTeamMembers,
  };
}
