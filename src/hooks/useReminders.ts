import { useMemo, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadsDB } from "@/hooks/useLeadsDB";
import { useLocations } from "@/hooks/useLocationsDB";
import { useReminderPreferences } from "@/hooks/useReminderPreferences";

export type ReminderSourceType = "lead_followup" | "lead_install" | "machine_install";

export interface ReminderItem {
  key: string;
  sourceType: ReminderSourceType;
  sourceId: string;
  title: string;
  subtitle: string;
  dueDate: Date | null;
  daysUntil: number | null;
  bucket: "overdue" | "today" | "upcoming";
  href: string;
}

interface DismissalRow {
  source_type: string;
  source_id: string;
  snoozed_until: string | null;
}

// Parse date-only strings (YYYY-MM-DD) as local dates to avoid timezone shifts
const parseDateOnly = (dateStr: string): Date => {
  const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = raw.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const diffInDays = (date: Date) => {
  const today = startOfToday();
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

export function useReminders() {
  const { user } = useAuth();
  const { leads, isLoading: leadsLoading } = useLeadsDB();
  const { locations, isLoaded: locationsLoaded } = useLocationsDB();
  const { preferences, isLoaded: prefsLoaded } = useReminderPreferences();
  const [dismissals, setDismissals] = useState<DismissalRow[]>([]);

  const fetchDismissals = useCallback(async () => {
    if (!user) {
      setDismissals([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("reminder_dismissals")
        .select("source_type, source_id, snoozed_until");
      if (error) throw error;
      setDismissals(data || []);
    } catch (error) {
      console.error("Error loading reminder dismissals:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDismissals();
  }, [fetchDismissals]);

  const items = useMemo<ReminderItem[]>(() => {
    const result: ReminderItem[] = [];
    const today = startOfToday();

    const push = (item: Omit<ReminderItem, "bucket" | "daysUntil" | "key">) => {
      const daysUntil = item.dueDate ? diffInDays(item.dueDate) : null;
      const bucket: ReminderItem["bucket"] =
        daysUntil === null ? "overdue" : daysUntil < 0 ? "overdue" : daysUntil === 0 ? "today" : "upcoming";
      result.push({
        ...item,
        key: `${item.sourceType}:${item.sourceId}`,
        daysUntil,
        bucket,
      });
    };

    if (preferences.leadFollowupEnabled) {
      for (const lead of leads) {
        if (lead.status === "won" || lead.status === "lost") continue;
        if (!lead.next_follow_up) continue;
        const due = parseDateOnly(lead.next_follow_up);
        if (diffInDays(due) > preferences.leadFollowupDaysBefore) continue;
        push({
          sourceType: "lead_followup",
          sourceId: lead.id,
          title: lead.business_name,
          subtitle: "Lead follow-up",
          dueDate: due,
          href: "/leads",
        });
      }
    }

    if (preferences.installEnabled) {
      for (const lead of leads) {
        if (lead.status === "lost") continue;
        const installDate = (lead as any).target_install_date as string | null | undefined;
        if (!installDate) continue;
        const due = parseDateOnly(installDate);
        if (diffInDays(due) > preferences.installDaysBefore) continue;
        push({
          sourceType: "lead_install",
          sourceId: lead.id,
          title: lead.business_name,
          subtitle: "Installation deadline",
          dueDate: due,
          href: "/leads",
        });
      }

      for (const location of locations) {
        if (!location.isActive) continue;
        for (const machine of location.machines || []) {
          if (!machine.id || machine.installedAt) continue;
          push({
            sourceType: "machine_install",
            sourceId: machine.id,
            title: `${location.name} — ${machine.customLabel || machine.label}`,
            subtitle: "Machine not marked installed",
            dueDate: null,
            href: "/locations",
          });
        }
      }
    }

    // Apply dismissals / snoozes
    const filtered = result.filter((item) => {
      const dismissal = dismissals.find(
        (d) => d.source_type === item.sourceType && d.source_id === item.sourceId
      );
      if (!dismissal) return true;
      if (!dismissal.snoozed_until) return false;
      return parseDateOnly(dismissal.snoozed_until) <= today;
    });

    const order = { overdue: 0, today: 1, upcoming: 2 };
    return filtered.sort((a, b) => {
      if (order[a.bucket] !== order[b.bucket]) return order[a.bucket] - order[b.bucket];
      const aTime = a.dueDate ? a.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueDate ? b.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [leads, locations, preferences, dismissals]);

  const grouped = useMemo(
    () => ({
      overdue: items.filter((i) => i.bucket === "overdue"),
      today: items.filter((i) => i.bucket === "today"),
      upcoming: items.filter((i) => i.bucket === "upcoming"),
    }),
    [items]
  );

  const writeDismissal = async (item: ReminderItem, snoozedUntil: string | null) => {
    if (!user) return;
    // Optimistic update
    setDismissals((prev) => [
      ...prev.filter((d) => !(d.source_type === item.sourceType && d.source_id === item.sourceId)),
      { source_type: item.sourceType, source_id: item.sourceId, snoozed_until: snoozedUntil },
    ]);
    try {
      const { error } = await supabase.from("reminder_dismissals").upsert(
        {
          user_id: user.id,
          source_type: item.sourceType,
          source_id: item.sourceId,
          snoozed_until: snoozedUntil,
          dismissed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,source_type,source_id" }
      );
      if (error) throw error;
    } catch (error) {
      console.error("Error saving reminder dismissal:", error);
      fetchDismissals();
    }
  };

  const dismiss = (item: ReminderItem) => writeDismissal(item, null);

  const snooze = (item: ReminderItem, days: number) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    const iso = `${until.getFullYear()}-${String(until.getMonth() + 1).padStart(2, "0")}-${String(
      until.getDate()
    ).padStart(2, "0")}`;
    return writeDismissal(item, iso);
  };

  return {
    items,
    grouped,
    count: items.length,
    isLoaded: !leadsLoading && locationsLoaded && prefsLoaded,
    dismiss,
    snooze,
    refetch: fetchDismissals,
  };
}
