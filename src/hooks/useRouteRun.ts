import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { MileageRoute, RouteStop } from "@/hooks/useRoutesDB";

export interface StopCollectionData {
  machineId: string;
  coinsInserted: number;
  prizesWon: number;
}

export interface StopResult {
  stopIndex: number;
  locationId?: string;
  locationName: string;
  collections: StopCollectionData[];
  notes: string;
  commissionPaid: boolean;
  commissionSummaryId?: string;
  completedAt: string;
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracy?: number;
}

export interface RouteRun {
  id: string;
  routeId: string;
  mileageEntryId?: string;
  currentStopIndex: number;
  status: "in_progress" | "completed" | "discarded";
  stopData: StopResult[];
  startedAt: Date;
  completedAt?: Date;
  // Enriched from join
  vehicleId?: string;
  trackingMode?: "gps" | "odometer";
}

export function useRouteRun() {
  const { user } = useAuth();
  const [activeRun, setActiveRun] = useState<RouteRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveRun = useCallback(async () => {
    if (!user) {
      setActiveRun(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("route_runs")
        .select("*, mileage_entries!route_runs_mileage_entry_id_fkey(vehicle_id, tracking_mode)")
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const entry = (data as any).mileage_entries;
        setActiveRun({
          id: data.id,
          routeId: data.route_id,
          mileageEntryId: data.mileage_entry_id || undefined,
          currentStopIndex: data.current_stop_index,
          status: data.status as RouteRun["status"],
          stopData: (data.stop_data as unknown as StopResult[]) || [],
          startedAt: new Date(data.started_at),
          completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
          vehicleId: entry?.vehicle_id || undefined,
          trackingMode: entry?.tracking_mode || undefined,
        });
      } else {
        setActiveRun(null);
      }
    } catch (error: any) {
      console.error("Error fetching active route run:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActiveRun();
  }, [fetchActiveRun]);

  const startRouteRun = async (params: {
    route: MileageRoute;
    vehicleId: string;
    trackingMode: "gps" | "odometer";
    odometerStart?: number;
    customStops?: RouteStop[];
  }): Promise<RouteRun | null> => {
    if (!user) return null;

    const { route, vehicleId, trackingMode, odometerStart, customStops } = params;
    const stops = customStops || route.stops;
    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1];

    const startLocation = firstStop?.customLocationName || "Route Start";
    const endLocation = lastStop?.customLocationName || route.name;

    try {
      // 1. Create the mileage entry (in_progress)
      const { data: entryData, error: entryError } = await supabase
        .from("mileage_entries")
        .insert({
          user_id: user.id,
          vehicle_id: vehicleId,
          start_location: startLocation,
          end_location: endLocation,
          route_id: route.id,
          odometer_start: odometerStart || 0,
          miles: 0,
          purpose: route.name,
          notes: "",
          is_round_trip: route.isRoundTrip,
          status: "in_progress",
          tracking_mode: trackingMode,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // 2. Create the route_run
      const { data: runData, error: runError } = await supabase
        .from("route_runs")
        .insert({
          user_id: user.id,
          route_id: route.id,
          mileage_entry_id: entryData.id,
          current_stop_index: 0,
          status: "in_progress",
          stop_data: [],
        })
        .select()
        .single();

      if (runError) throw runError;

      const newRun: RouteRun = {
        id: runData.id,
        routeId: runData.route_id,
        mileageEntryId: runData.mileage_entry_id || undefined,
        currentStopIndex: 0,
        status: "in_progress",
        stopData: [],
        startedAt: new Date(runData.started_at),
        vehicleId,
        trackingMode,
      };

      setActiveRun(newRun);
      return newRun;
    } catch (error: any) {
      console.error("Error starting route run:", error);
      toast({
        title: "Error",
        description: "Failed to start route run.",
        variant: "destructive",
      });
      return null;
    }
  };

  const completeStop = async (stopResult: StopResult): Promise<boolean> => {
    if (!user || !activeRun) return false;

    try {
      const newStopData = [...activeRun.stopData, stopResult];
      const newIndex = activeRun.currentStopIndex + 1;

      const { error } = await supabase
        .from("route_runs")
        .update({
          current_stop_index: newIndex,
          stop_data: newStopData as any,
        })
        .eq("id", activeRun.id);

      if (error) throw error;

      // Save machine collections to the database
      for (const coll of stopResult.collections) {
        if (coll.coinsInserted > 0 || coll.prizesWon > 0) {
          await supabase.from("machine_collections").insert({
            user_id: user.id,
            location_id: stopResult.locationId!,
            machine_id: coll.machineId,
            collection_date: new Date().toISOString(),
            coins_inserted: coll.coinsInserted,
            prizes_won: coll.prizesWon,
          });
        }
      }

      // Mark commission as paid if requested
      if (stopResult.commissionPaid && stopResult.commissionSummaryId) {
        await supabase
          .from("commission_summaries")
          .update({
            commission_paid: true,
            commission_paid_at: new Date().toISOString(),
          })
          .eq("id", stopResult.commissionSummaryId);
      }

      setActiveRun((prev) =>
        prev
          ? { ...prev, currentStopIndex: newIndex, stopData: newStopData }
          : null
      );

      return true;
    } catch (error: any) {
      console.error("Error completing stop:", error);
      toast({
        title: "Error",
        description: "Failed to save stop data.",
        variant: "destructive",
      });
      return false;
    }
  };

  const completeRouteRun = async (params?: {
    odometerEnd?: number;
    gpsDistanceMeters?: number;
    gpsEndLat?: number;
    gpsEndLng?: number;
  }): Promise<boolean> => {
    if (!user || !activeRun) return false;

    try {
      // 1. Complete the route_run
      const { error: runError } = await supabase
        .from("route_runs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", activeRun.id);

      if (runError) throw runError;

      // 2. Complete the mileage entry
      if (activeRun.mileageEntryId) {
        let miles = 0;

        if (activeRun.trackingMode === "odometer" && params?.odometerEnd) {
          // Fetch the start odometer from the mileage entry
          const { data: entryData } = await supabase
            .from("mileage_entries")
            .select("odometer_start")
            .eq("id", activeRun.mileageEntryId)
            .single();

          const startOdo = Number(entryData?.odometer_start) || 0;
          miles = params.odometerEnd - startOdo;
        } else if (activeRun.trackingMode === "gps" && params?.gpsDistanceMeters) {
          miles = params.gpsDistanceMeters / 1609.344;
        }

        const { error: entryError } = await supabase
          .from("mileage_entries")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            miles: Math.max(miles, 0),
            odometer_end: params?.odometerEnd || null,
            gps_distance_meters: params?.gpsDistanceMeters || null,
            gps_end_lat: params?.gpsEndLat || null,
            gps_end_lng: params?.gpsEndLng || null,
          })
          .eq("id", activeRun.mileageEntryId);

        if (entryError) throw entryError;
      }

      setActiveRun(null);

      toast({
        title: "Route Complete!",
        description: `Finished ${activeRun.stopData.length + 1} stops.`,
      });

      return true;
    } catch (error: any) {
      console.error("Error completing route run:", error);
      toast({
        title: "Error",
        description: "Failed to complete route run.",
        variant: "destructive",
      });
      return false;
    }
  };

  const discardRouteRun = async (): Promise<boolean> => {
    if (!user || !activeRun) return false;

    try {
      // Delete the route run
      await supabase.from("route_runs").delete().eq("id", activeRun.id);

      // Delete the associated mileage entry
      if (activeRun.mileageEntryId) {
        await supabase.from("mileage_entries").delete().eq("id", activeRun.mileageEntryId);
      }

      setActiveRun(null);
      toast({ title: "Route Run Discarded" });
      return true;
    } catch (error: any) {
      console.error("Error discarding route run:", error);
      toast({
        title: "Error",
        description: "Failed to discard route run.",
        variant: "destructive",
      });
      return false;
    }
  };

  const goToStop = async (index: number): Promise<boolean> => {
    if (!user || !activeRun) return false;

    try {
      const { error } = await supabase
        .from("route_runs")
        .update({ current_stop_index: index })
        .eq("id", activeRun.id);

      if (error) throw error;

      setActiveRun((prev) =>
        prev ? { ...prev, currentStopIndex: index } : null
      );
      return true;
    } catch (error: any) {
      console.error("Error navigating to stop:", error);
      toast({
        title: "Error",
        description: "Failed to navigate to stop.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    activeRun,
    isLoading,
    startRouteRun,
    completeStop,
    completeRouteRun,
    discardRouteRun,
    goToStop,
    refetch: fetchActiveRun,
  };
}
