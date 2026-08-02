import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ReminderPreferences {
  leadFollowupEnabled: boolean;
  installEnabled: boolean;
  leadFollowupDaysBefore: number;
  installDaysBefore: number;
}

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  leadFollowupEnabled: true,
  installEnabled: true,
  leadFollowupDaysBefore: 3,
  installDaysBefore: 3,
};

export function useReminderPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ReminderPreferences>(DEFAULT_REMINDER_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(DEFAULT_REMINDER_PREFERENCES);
      setIsLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("reminder_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          leadFollowupEnabled: data.lead_followup_enabled,
          installEnabled: data.install_enabled,
          leadFollowupDaysBefore: data.lead_followup_days_before,
          installDaysBefore: data.install_days_before,
        });
      } else {
        setPreferences(DEFAULT_REMINDER_PREFERENCES);
      }
    } catch (error) {
      console.error("Error loading reminder preferences:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (updates: Partial<ReminderPreferences>) => {
    if (!user) return;

    const next = { ...preferences, ...updates };
    setPreferences(next);

    try {
      const { error } = await supabase
        .from("reminder_preferences")
        .upsert(
          {
            user_id: user.id,
            lead_followup_enabled: next.leadFollowupEnabled,
            install_enabled: next.installEnabled,
            lead_followup_days_before: next.leadFollowupDaysBefore,
            install_days_before: next.installDaysBefore,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;
    } catch (error) {
      console.error("Error saving reminder preferences:", error);
      setPreferences(preferences);
      toast({
        title: "Error",
        description: "Failed to save reminder settings.",
        variant: "destructive",
      });
    }
  };

  return { preferences, isLoaded, updatePreferences, refetch: fetchPreferences };
}
