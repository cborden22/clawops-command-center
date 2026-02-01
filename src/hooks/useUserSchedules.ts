import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface UserSchedule {
  id: string;
  userId: string;
  scheduleType: string;
  frequencyDays: number | null;
  dayOfWeek: number | null;
  lastCompletedDate: Date | null;
  nextScheduledDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function useUserSchedules() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<UserSchedule[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchSchedules = async () => {
    if (!user) {
      setSchedules([]);
      setIsLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_schedules")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const mapped: UserSchedule[] = (data || []).map((s) => ({
        id: s.id,
        userId: s.user_id,
        scheduleType: s.schedule_type,
        frequencyDays: s.frequency_days,
        dayOfWeek: s.day_of_week,
        lastCompletedDate: s.last_completed_date ? new Date(s.last_completed_date) : null,
        nextScheduledDate: s.next_scheduled_date ? new Date(s.next_scheduled_date) : null,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      }));

      setSchedules(mapped);
    } catch (error: any) {
      console.error("Error fetching user schedules:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSchedules();
    } else {
      setSchedules([]);
      setIsLoaded(true);
    }
  }, [user?.id]);

  const getScheduleByType = (scheduleType: string): UserSchedule | undefined => {
    return schedules.find((s) => s.scheduleType === scheduleType);
  };

  const upsertSchedule = async (
    scheduleType: string,
    frequencyDays: number | null,
    dayOfWeek: number | null
  ): Promise<boolean> => {
    if (!user) return false;

    // Calculate next scheduled date
    let nextScheduledDate: string | null = null;
    if (frequencyDays && dayOfWeek !== null) {
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      let daysUntilNextOccurrence = dayOfWeek - currentDayOfWeek;
      if (daysUntilNextOccurrence <= 0) {
        daysUntilNextOccurrence += 7;
      }
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntilNextOccurrence);
      nextScheduledDate = nextDate.toISOString().split("T")[0];
    }

    try {
      const existing = schedules.find((s) => s.scheduleType === scheduleType);

      if (existing) {
        const { error } = await supabase
          .from("user_schedules")
          .update({
            frequency_days: frequencyDays,
            day_of_week: dayOfWeek,
            next_scheduled_date: nextScheduledDate,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_schedules").insert({
          user_id: user.id,
          schedule_type: scheduleType,
          frequency_days: frequencyDays,
          day_of_week: dayOfWeek,
          next_scheduled_date: nextScheduledDate,
        });

        if (error) throw error;
      }

      await fetchSchedules();
      return true;
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error",
        description: "Failed to save schedule.",
        variant: "destructive",
      });
      return false;
    }
  };

  const markScheduleComplete = async (scheduleType: string): Promise<boolean> => {
    if (!user) return false;

    const existing = schedules.find((s) => s.scheduleType === scheduleType);
    if (!existing || !existing.frequencyDays) return false;

    const today = new Date();
    
    // Calculate next occurrence
    let nextScheduledDate: string | null = null;
    if (existing.dayOfWeek !== null) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + existing.frequencyDays);
      // Adjust to the preferred day of week
      const targetDay = existing.dayOfWeek;
      const currentDay = nextDate.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd < 0) daysToAdd += 7;
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      nextScheduledDate = nextDate.toISOString().split("T")[0];
    } else {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + existing.frequencyDays);
      nextScheduledDate = nextDate.toISOString().split("T")[0];
    }

    try {
      const { error } = await supabase
        .from("user_schedules")
        .update({
          last_completed_date: today.toISOString(),
          next_scheduled_date: nextScheduledDate,
        })
        .eq("id", existing.id);

      if (error) throw error;

      await fetchSchedules();
      return true;
    } catch (error: any) {
      console.error("Error marking schedule complete:", error);
      return false;
    }
  };

  const deleteSchedule = async (scheduleType: string): Promise<boolean> => {
    if (!user) return false;

    const existing = schedules.find((s) => s.scheduleType === scheduleType);
    if (!existing) return true;

    try {
      const { error } = await supabase
        .from("user_schedules")
        .delete()
        .eq("id", existing.id);

      if (error) throw error;

      await fetchSchedules();
      return true;
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      return false;
    }
  };

  return {
    schedules,
    isLoaded,
    getScheduleByType,
    upsertSchedule,
    markScheduleComplete,
    deleteSchedule,
    refetch: fetchSchedules,
  };
}
