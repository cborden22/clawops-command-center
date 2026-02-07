import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserDisplayInfo {
  fullName: string | null;
  email: string | null;
  initials: string;
}

// Cache for user display info to avoid repeated queries
const userDisplayCache = new Map<string, UserDisplayInfo>();

/**
 * Hook to get display information (name, initials) for a user.
 * Caches results to minimize database queries.
 */
export function useUserDisplay(userId: string | null | undefined) {
  const [displayInfo, setDisplayInfo] = useState<UserDisplayInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDisplay = async () => {
      if (!userId) {
        setDisplayInfo(null);
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cached = userDisplayCache.get(userId);
      if (cached) {
        setDisplayInfo(cached);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching user display:", error);
        }

        const info: UserDisplayInfo = {
          fullName: data?.full_name || null,
          email: data?.email || null,
          initials: getInitials(data?.full_name || data?.email),
        };

        // Cache the result
        userDisplayCache.set(userId, info);
        setDisplayInfo(info);
      } catch (error) {
        console.error("Error in user display:", error);
        const fallback: UserDisplayInfo = {
          fullName: null,
          email: null,
          initials: "?",
        };
        setDisplayInfo(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDisplay();
  }, [userId]);

  return { displayInfo, isLoading };
}

/**
 * Get initials from a name or email
 */
function getInitials(nameOrEmail: string | null | undefined): string {
  if (!nameOrEmail) return "?";

  // If it's an email, use first letter of local part
  if (nameOrEmail.includes("@")) {
    const localPart = nameOrEmail.split("@")[0];
    return localPart.charAt(0).toUpperCase();
  }

  // Split name into parts and get first letter of each (max 2)
  const parts = nameOrEmail.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Batch fetch user display info for multiple users
 */
export async function fetchUsersDisplay(userIds: string[]): Promise<Map<string, UserDisplayInfo>> {
  const result = new Map<string, UserDisplayInfo>();
  const idsToFetch: string[] = [];

  // Check cache first
  for (const id of userIds) {
    const cached = userDisplayCache.get(id);
    if (cached) {
      result.set(id, cached);
    } else {
      idsToFetch.push(id);
    }
  }

  if (idsToFetch.length === 0) {
    return result;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", idsToFetch);

    if (error) {
      console.error("Error batch fetching user display:", error);
      return result;
    }

    for (const profile of data || []) {
      const info: UserDisplayInfo = {
        fullName: profile.full_name,
        email: profile.email,
        initials: getInitials(profile.full_name || profile.email),
      };
      userDisplayCache.set(profile.user_id, info);
      result.set(profile.user_id, info);
    }

    // Fill in any missing users with fallback
    for (const id of idsToFetch) {
      if (!result.has(id)) {
        const fallback: UserDisplayInfo = {
          fullName: null,
          email: null,
          initials: "?",
        };
        userDisplayCache.set(id, fallback);
        result.set(id, fallback);
      }
    }
  } catch (error) {
    console.error("Error in batch user display:", error);
  }

  return result;
}

/**
 * Clear the user display cache (useful after profile updates)
 */
export function clearUserDisplayCache(userId?: string) {
  if (userId) {
    userDisplayCache.delete(userId);
  } else {
    userDisplayCache.clear();
  }
}
