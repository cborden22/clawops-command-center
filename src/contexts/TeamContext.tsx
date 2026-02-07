import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TeamContextValue {
  isTeamMember: boolean;
  ownerUserId: string | null;
  effectiveUserId: string | null;
  isLoading: boolean;
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

interface TeamContextProviderProps {
  children: ReactNode;
}

/**
 * Provider for team context. Wraps the app to provide team member info.
 * 
 * If the current user is a team member, effectiveUserId returns the owner's ID
 * to use for user_id columns (for proper RLS) while keeping track
 * of who actually created the data (created_by_user_id).
 * 
 * If the current user is an owner, returns their own ID.
 */
export function TeamContextProvider({ children }: TeamContextProviderProps) {
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

  const value: TeamContextValue = {
    isTeamMember,
    ownerUserId,
    effectiveUserId: ownerUserId,
    isLoading,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

/**
 * Hook to get the effective owner context for data operations.
 * Must be used within a TeamContextProvider.
 */
export function useTeamContext(): TeamContextValue {
  const context = useContext(TeamContext);
  if (context === undefined) {
    // Return a safe default if used outside provider (during initial render)
    return {
      isTeamMember: false,
      ownerUserId: null,
      effectiveUserId: null,
      isLoading: true,
    };
  }
  return context;
}
