import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ActiveTrip {
  id: string;
  vehicleId: string;
  startLocation: string;
  endLocation: string;
  locationId?: string;
  routeId?: string;
  odometerStart: number;
  odometerEnd?: number;
  purpose: string;
  notes: string;
  trackingMode: "gps" | "odometer";
  startedAt: Date;
  gpsDistanceMeters?: number;
  gpsStartLat?: number;
  gpsStartLng?: number;
}

export function useActiveTrip() {
  const { user } = useAuth();
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch any in-progress trip for the current user
  const fetchActiveTrip = useCallback(async () => {
    if (!user) {
      setActiveTrip(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("mileage_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setActiveTrip({
          id: data.id,
          vehicleId: data.vehicle_id || "",
          startLocation: data.start_location,
          endLocation: data.end_location,
          locationId: data.location_id || undefined,
          routeId: data.route_id || undefined,
          odometerStart: Number(data.odometer_start) || 0,
          odometerEnd: data.odometer_end ? Number(data.odometer_end) : undefined,
          purpose: data.purpose || "",
          notes: data.notes || "",
          trackingMode: (data.tracking_mode as "gps" | "odometer") || "odometer",
          startedAt: new Date(data.started_at || data.created_at),
          gpsDistanceMeters: data.gps_distance_meters ? Number(data.gps_distance_meters) : undefined,
          gpsStartLat: data.gps_start_lat ? Number(data.gps_start_lat) : undefined,
          gpsStartLng: data.gps_start_lng ? Number(data.gps_start_lng) : undefined,
        });
      } else {
        setActiveTrip(null);
      }
    } catch (error: any) {
      console.error("Error fetching active trip:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActiveTrip();
  }, [fetchActiveTrip]);

  // Start a new trip (creates an in-progress entry)
  const startTrip = async (tripData: {
    vehicleId: string;
    startLocation: string;
    endLocation: string;
    locationId?: string;
    routeId?: string;
    odometerStart: number;
    purpose: string;
    notes?: string;
    trackingMode: "gps" | "odometer";
    gpsStartLat?: number;
    gpsStartLng?: number;
  }): Promise<ActiveTrip | null> => {
    if (!user) return null;

    // Check if there's already an active trip
    if (activeTrip) {
      toast({
        title: "Active Trip Exists",
        description: "Please complete or discard your current trip first.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("mileage_entries")
        .insert({
          user_id: user.id,
          vehicle_id: tripData.vehicleId,
          start_location: tripData.startLocation,
          end_location: tripData.endLocation,
          location_id: tripData.locationId || null,
          route_id: tripData.routeId || null,
          odometer_start: tripData.odometerStart,
          miles: 0, // Will be calculated when trip is completed
          purpose: tripData.purpose,
          notes: tripData.notes || "",
          is_round_trip: false,
          status: "in_progress",
          tracking_mode: tripData.trackingMode,
          started_at: new Date().toISOString(),
          gps_start_lat: tripData.gpsStartLat || null,
          gps_start_lng: tripData.gpsStartLng || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newTrip: ActiveTrip = {
        id: data.id,
        vehicleId: data.vehicle_id || "",
        startLocation: data.start_location,
        endLocation: data.end_location,
        locationId: data.location_id || undefined,
        routeId: data.route_id || undefined,
        odometerStart: Number(data.odometer_start) || 0,
        purpose: data.purpose || "",
        notes: data.notes || "",
        trackingMode: (data.tracking_mode as "gps" | "odometer") || "odometer",
        startedAt: new Date(data.started_at || data.created_at),
        gpsStartLat: data.gps_start_lat ? Number(data.gps_start_lat) : undefined,
        gpsStartLng: data.gps_start_lng ? Number(data.gps_start_lng) : undefined,
      };

      setActiveTrip(newTrip);
      return newTrip;
    } catch (error: any) {
      console.error("Error starting trip:", error);
      toast({
        title: "Error",
        description: "Failed to start trip. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update an in-progress trip (e.g., update end odometer, GPS distance)
  const updateTrip = async (updates: Partial<{
    odometerEnd: number;
    gpsDistanceMeters: number;
    gpsEndLat: number;
    gpsEndLng: number;
    notes: string;
  }>): Promise<boolean> => {
    if (!user || !activeTrip) return false;

    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.odometerEnd !== undefined) {
        dbUpdates.odometer_end = updates.odometerEnd;
      }
      if (updates.gpsDistanceMeters !== undefined) {
        dbUpdates.gps_distance_meters = updates.gpsDistanceMeters;
      }
      if (updates.gpsEndLat !== undefined) {
        dbUpdates.gps_end_lat = updates.gpsEndLat;
      }
      if (updates.gpsEndLng !== undefined) {
        dbUpdates.gps_end_lng = updates.gpsEndLng;
      }
      if (updates.notes !== undefined) {
        dbUpdates.notes = updates.notes;
      }

      const { error } = await supabase
        .from("mileage_entries")
        .update(dbUpdates)
        .eq("id", activeTrip.id);

      if (error) throw error;

      // Update local state
      setActiveTrip((prev) =>
        prev
          ? {
              ...prev,
              odometerEnd: updates.odometerEnd ?? prev.odometerEnd,
              gpsDistanceMeters: updates.gpsDistanceMeters ?? prev.gpsDistanceMeters,
              notes: updates.notes ?? prev.notes,
            }
          : null
      );

      return true;
    } catch (error: any) {
      console.error("Error updating trip:", error);
      return false;
    }
  };

  // Complete an in-progress trip
  const completeTrip = async (
    completionData: {
      odometerEnd?: number;
      gpsDistanceMeters?: number;
      gpsEndLat?: number;
      gpsEndLng?: number;
    }
  ): Promise<boolean> => {
    if (!user || !activeTrip) return false;

    try {
      // Calculate miles based on tracking mode
      let miles = 0;
      
      if (activeTrip.trackingMode === "odometer") {
        if (!completionData.odometerEnd || completionData.odometerEnd <= activeTrip.odometerStart) {
          toast({
            title: "Invalid Odometer",
            description: "End odometer must be greater than start odometer.",
            variant: "destructive",
          });
          return false;
        }
        miles = completionData.odometerEnd - activeTrip.odometerStart;
      } else if (activeTrip.trackingMode === "gps") {
        // Convert meters to miles
        miles = (completionData.gpsDistanceMeters || 0) / 1609.344;
      }

      const { error } = await supabase
        .from("mileage_entries")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          miles,
          odometer_end: completionData.odometerEnd || null,
          gps_distance_meters: completionData.gpsDistanceMeters || null,
          gps_end_lat: completionData.gpsEndLat || null,
          gps_end_lng: completionData.gpsEndLng || null,
        })
        .eq("id", activeTrip.id);

      if (error) throw error;

      setActiveTrip(null);
      
      toast({
        title: "Trip Completed",
        description: `${miles.toFixed(1)} miles recorded.`,
      });

      return true;
    } catch (error: any) {
      console.error("Error completing trip:", error);
      toast({
        title: "Error",
        description: "Failed to complete trip. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Discard (delete) an in-progress trip
  const discardTrip = async (): Promise<boolean> => {
    if (!user || !activeTrip) return false;

    try {
      const { error } = await supabase
        .from("mileage_entries")
        .delete()
        .eq("id", activeTrip.id);

      if (error) throw error;

      setActiveTrip(null);
      
      toast({
        title: "Trip Discarded",
        description: "The in-progress trip has been removed.",
      });

      return true;
    } catch (error: any) {
      console.error("Error discarding trip:", error);
      toast({
        title: "Error",
        description: "Failed to discard trip. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    activeTrip,
    isLoading,
    startTrip,
    updateTrip,
    completeTrip,
    discardTrip,
    refetch: fetchActiveTrip,
  };
}
