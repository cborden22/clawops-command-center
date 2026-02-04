import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

export interface WidgetConfig {
  id: string;
  visible: boolean;
  size: WidgetSize;
}

export interface UserPreferences {
  dashboardLayout: WidgetConfig[];
}

const DEFAULT_PREFERENCES: UserPreferences = {
  dashboardLayout: [],
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchPreferences = async () => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      setIsLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.dashboard_layout && Array.isArray(data.dashboard_layout)) {
        setPreferences({
          dashboardLayout: data.dashboard_layout as unknown as WidgetConfig[],
        });
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (error: any) {
      console.error("Error fetching preferences:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const updateDashboardLayout = async (layout: WidgetConfig[]) => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_preferences")
          .update({ dashboard_layout: layout as any })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_preferences")
          .insert({
            user_id: user.id,
            dashboard_layout: layout as any,
          });
      }

      setPreferences(prev => ({ ...prev, dashboardLayout: layout }));
    } catch (error: any) {
      console.error("Error updating preferences:", error);
    }
  };

  return {
    preferences,
    isLoaded,
    updateDashboardLayout,
    refetch: fetchPreferences,
  };
}
