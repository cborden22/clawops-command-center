import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TeamContext {
  isTeamMember: boolean;
  ownerUserId: string | null;
  effectiveUserId: string | null;
  isLoading: boolean;
}

/**
 * Hook to get the effective owner context for data operations.
 * 
 * If the current user is a team member, this returns the owner's ID
 * to use for user_id columns (for proper RLS) while keeping track
 * of who actually created the data (created_by_user_id).
 * 
 * If the current user is an owner, returns their own ID.
 */
export function useTeamContext(): TeamContext {
  const { user } = useAuth();
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamContext = async () => {
      if (!user) {
        setOwnerUserId(null);
        setIsTeamMember(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if current user is a team member of someone else
        const { data: membership, error } = await supabase
          .from("team_members")
          .select("owner_user_id")
          .eq("member_user_id", user.id)
          .eq("status", "active")
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows returned (not an error, just not a team member)
          console.error("Error fetching team context:", error);
        }

        if (membership) {
          setOwnerUserId(membership.owner_user_id);
          setIsTeamMember(true);
        } else {
          // User is an owner, use their own ID
          setOwnerUserId(user.id);
          setIsTeamMember(false);
        }
      } catch (error) {
        console.error("Error in team context:", error);
        // Fallback to using user's own ID
        setOwnerUserId(user.id);
        setIsTeamMember(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamContext();
  }, [user?.id]);

  return {
    isTeamMember,
    ownerUserId,
    // The effective user ID to use for user_id columns in inserts
    effectiveUserId: ownerUserId,
    isLoading,
  };
}
