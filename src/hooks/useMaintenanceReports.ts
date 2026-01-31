import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MaintenanceReport {
  id: string;
  machine_id: string;
  user_id: string;
  reporter_name: string | null;
  reporter_contact: string | null;
  issue_type: string;
  description: string;
  severity: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  // Joined fields
  machine_type?: string;
  machine_label?: string;
  location_name?: string;
}

export function useMaintenanceReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!user) {
      setReports([]);
      setIsLoaded(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("maintenance_reports")
        .select(`
          *,
          location_machines!inner(
            machine_type,
            custom_label,
            locations!inner(name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedReports: MaintenanceReport[] = (data || []).map((report: any) => ({
        id: report.id,
        machine_id: report.machine_id,
        user_id: report.user_id,
        reporter_name: report.reporter_name,
        reporter_contact: report.reporter_contact,
        issue_type: report.issue_type,
        description: report.description,
        severity: report.severity,
        status: report.status,
        resolution_notes: report.resolution_notes,
        created_at: report.created_at,
        resolved_at: report.resolved_at,
        machine_type: report.location_machines?.machine_type,
        machine_label: report.location_machines?.custom_label,
        location_name: report.location_machines?.locations?.name,
      }));

      setReports(formattedReports);
    } catch (error) {
      console.error("Error fetching maintenance reports:", error);
    } finally {
      setIsLoaded(true);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateReport = async (
    id: string,
    updates: Partial<Pick<MaintenanceReport, "status" | "resolution_notes" | "resolved_at">>
  ) => {
    try {
      const { error } = await supabase
        .from("maintenance_reports")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
      return true;
    } catch (error) {
      console.error("Error updating report:", error);
      return false;
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from("maintenance_reports")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setReports((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting report:", error);
      return false;
    }
  };

  const openReports = reports.filter((r) => r.status === "open");
  const inProgressReports = reports.filter((r) => r.status === "in_progress");
  const resolvedReports = reports.filter((r) => r.status === "resolved");

  return {
    reports,
    openReports,
    inProgressReports,
    resolvedReports,
    isLoaded,
    isLoading,
    refetch: fetchReports,
    updateReport,
    deleteReport,
  };
}

// Public function to submit a report (no auth required)
export async function submitMaintenanceReport(data: {
  machine_id: string;
  reporter_name?: string;
  reporter_contact?: string;
  issue_type: string;
  description: string;
  severity: string;
}) {
  // First, get the machine owner
  const { data: ownerData, error: ownerError } = await supabase.rpc(
    "get_machine_owner",
    { machine_uuid: data.machine_id }
  );

  if (ownerError || !ownerData) {
    throw new Error("Invalid machine ID or machine not found");
  }

  // Insert the report with the owner's user_id
  const { error } = await supabase.from("maintenance_reports").insert({
    machine_id: data.machine_id,
    user_id: ownerData,
    reporter_name: data.reporter_name || null,
    reporter_contact: data.reporter_contact || null,
    issue_type: data.issue_type,
    description: data.description,
    severity: data.severity,
    status: "open",
  });

  if (error) throw error;

  return true;
}

// Public function to get machine info (no auth required)
export async function getMachinePublicInfo(machineId: string) {
  const { data, error } = await supabase.rpc("get_machine_public_info", {
    machine_uuid: machineId,
  });

  if (error) throw error;

  return data?.[0] || null;
}
