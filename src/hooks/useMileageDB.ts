import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface MileageEntry {
  id: string;
  date: Date;
  startLocation: string;
  endLocation: string;
  locationId?: string;
  miles: number;
  purpose: string;
  notes: string;
  isRoundTrip: boolean;
  vehicleId?: string;
  odometerStart?: number;
  odometerEnd?: number;
  createdAt: Date;
}

// 2024 IRS standard mileage rate
export const IRS_MILEAGE_RATE = 0.67;

export function useMileage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchEntries = async () => {
    if (!user) {
      setEntries([]);
      setIsLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("mileage_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      const mappedEntries: MileageEntry[] = (data || []).map(e => ({
        id: e.id,
        date: new Date(e.date),
        startLocation: e.start_location,
        endLocation: e.end_location,
        locationId: e.location_id || undefined,
        miles: Number(e.miles) || 0,
        purpose: e.purpose || "",
        notes: e.notes || "",
        isRoundTrip: e.is_round_trip || false,
        vehicleId: e.vehicle_id || undefined,
        odometerStart: e.odometer_start ? Number(e.odometer_start) : undefined,
        odometerEnd: e.odometer_end ? Number(e.odometer_end) : undefined,
        createdAt: new Date(e.created_at),
      }));

      setEntries(mappedEntries);
    } catch (error: any) {
      console.error("Error fetching mileage entries:", error);
      toast({
        title: "Error",
        description: "Failed to load mileage entries.",
        variant: "destructive",
      });
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEntries();
    } else {
      setEntries([]);
      setIsLoaded(true);
    }
  }, [user?.id]);

  const addEntry = async (entry: Omit<MileageEntry, "id" | "createdAt">) => {
    if (!user) return null;

    // If round trip, the actual miles is already doubled by the caller or we can store as-is
    // The component will handle the doubling before calling this
    const actualMiles = entry.miles;

    try {
      const { data, error } = await supabase
        .from("mileage_entries")
        .insert({
          user_id: user.id,
          date: entry.date.toISOString(),
          start_location: entry.startLocation,
          end_location: entry.endLocation,
          location_id: entry.locationId || null,
          miles: actualMiles,
          purpose: entry.purpose,
          notes: entry.notes,
          is_round_trip: entry.isRoundTrip,
          vehicle_id: entry.vehicleId || null,
          odometer_start: entry.odometerStart || null,
          odometer_end: entry.odometerEnd || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (error) throw error;

      const newEntry: MileageEntry = {
        id: data.id,
        date: new Date(data.date),
        startLocation: data.start_location,
        endLocation: data.end_location,
        locationId: data.location_id || undefined,
        miles: Number(data.miles) || 0,
        purpose: data.purpose || "",
        notes: data.notes || "",
        isRoundTrip: data.is_round_trip || false,
        vehicleId: data.vehicle_id || undefined,
        odometerStart: data.odometer_start ? Number(data.odometer_start) : undefined,
        odometerEnd: data.odometer_end ? Number(data.odometer_end) : undefined,
        createdAt: new Date(data.created_at),
      };

      setEntries(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (error: any) {
      console.error("Error adding mileage entry:", error);
      toast({
        title: "Error",
        description: "Failed to add mileage entry.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEntry = async (id: string, updates: Partial<Omit<MileageEntry, "id" | "createdAt">>) => {
    if (!user) return null;

    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.date !== undefined) dbUpdates.date = updates.date.toISOString();
      if (updates.startLocation !== undefined) dbUpdates.start_location = updates.startLocation;
      if (updates.endLocation !== undefined) dbUpdates.end_location = updates.endLocation;
      if (updates.locationId !== undefined) dbUpdates.location_id = updates.locationId || null;
      if (updates.miles !== undefined) dbUpdates.miles = updates.miles;
      if (updates.purpose !== undefined) dbUpdates.purpose = updates.purpose;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.isRoundTrip !== undefined) dbUpdates.is_round_trip = updates.isRoundTrip;
      if (updates.vehicleId !== undefined) dbUpdates.vehicle_id = updates.vehicleId || null;
      if (updates.odometerStart !== undefined) dbUpdates.odometer_start = updates.odometerStart || null;
      if (updates.odometerEnd !== undefined) dbUpdates.odometer_end = updates.odometerEnd || null;

      const { data, error } = await supabase
        .from("mileage_entries")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      const updatedEntry: MileageEntry = {
        id: data.id,
        date: new Date(data.date),
        startLocation: data.start_location,
        endLocation: data.end_location,
        locationId: data.location_id || undefined,
        miles: Number(data.miles) || 0,
        purpose: data.purpose || "",
        notes: data.notes || "",
        isRoundTrip: data.is_round_trip || false,
        vehicleId: data.vehicle_id || undefined,
        odometerStart: data.odometer_start ? Number(data.odometer_start) : undefined,
        odometerEnd: data.odometer_end ? Number(data.odometer_end) : undefined,
        createdAt: new Date(data.created_at),
      };

      setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
      return updatedEntry;
    } catch (error: any) {
      console.error("Error updating mileage entry:", error);
      toast({
        title: "Error",
        description: "Failed to update mileage entry.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("mileage_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (error: any) {
      console.error("Error deleting mileage entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete mileage entry.",
        variant: "destructive",
      });
    }
  };

  // Calculate totals for a filtered set of entries
  const calculateTotals = (filteredEntries: MileageEntry[]) => {
    const totalMiles = filteredEntries.reduce((sum, e) => sum + e.miles, 0);
    const taxDeduction = totalMiles * IRS_MILEAGE_RATE;
    const tripCount = filteredEntries.length;
    return { totalMiles, taxDeduction, tripCount };
  };

  return {
    entries,
    isLoaded,
    addEntry,
    updateEntry,
    deleteEntry,
    calculateTotals,
    refetch: fetchEntries,
  };
}
