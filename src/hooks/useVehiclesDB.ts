import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Vehicle {
  id: string;
  name: string;
  year?: number;
  make?: string;
  model?: string;
  licensePlate?: string;
  lastRecordedOdometer?: number;
  createdAt: Date;
  updatedAt: Date;
}

export function useVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchVehicles = async () => {
    if (!user) {
      setVehicles([]);
      setIsLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;

      const mappedVehicles: Vehicle[] = (data || []).map(v => ({
        id: v.id,
        name: v.name,
        year: v.year || undefined,
        make: v.make || undefined,
        model: v.model || undefined,
        licensePlate: v.license_plate || undefined,
        lastRecordedOdometer: v.last_recorded_odometer ? Number(v.last_recorded_odometer) : undefined,
        createdAt: new Date(v.created_at),
        updatedAt: new Date(v.updated_at),
      }));

      setVehicles(mappedVehicles);
    } catch (error: any) {
      console.error("Error fetching vehicles:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicles.",
        variant: "destructive",
      });
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVehicles();
    } else {
      setVehicles([]);
      setIsLoaded(true);
    }
  }, [user?.id]);

  const addVehicle = async (vehicle: Omit<Vehicle, "id" | "createdAt" | "updatedAt">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          user_id: user.id,
          name: vehicle.name,
          year: vehicle.year || null,
          make: vehicle.make || null,
          model: vehicle.model || null,
          license_plate: vehicle.licensePlate || null,
          last_recorded_odometer: vehicle.lastRecordedOdometer || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newVehicle: Vehicle = {
        id: data.id,
        name: data.name,
        year: data.year || undefined,
        make: data.make || undefined,
        model: data.model || undefined,
        licensePlate: data.license_plate || undefined,
        lastRecordedOdometer: data.last_recorded_odometer ? Number(data.last_recorded_odometer) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setVehicles(prev => [...prev, newVehicle].sort((a, b) => a.name.localeCompare(b.name)));
      return newVehicle;
    } catch (error: any) {
      console.error("Error adding vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to add vehicle.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateVehicle = async (id: string, updates: Partial<Omit<Vehicle, "id" | "createdAt" | "updatedAt">>) => {
    if (!user) return false;

    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.year !== undefined) dbUpdates.year = updates.year || null;
      if (updates.make !== undefined) dbUpdates.make = updates.make || null;
      if (updates.model !== undefined) dbUpdates.model = updates.model || null;
      if (updates.licensePlate !== undefined) dbUpdates.license_plate = updates.licensePlate || null;
      if (updates.lastRecordedOdometer !== undefined) dbUpdates.last_recorded_odometer = updates.lastRecordedOdometer || null;

      const { error } = await supabase
        .from("vehicles")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;

      setVehicles(prev =>
        prev.map(v =>
          v.id === id
            ? { ...v, ...updates, updatedAt: new Date() }
            : v
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
      return true;
    } catch (error: any) {
      console.error("Error updating vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to update vehicle.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setVehicles(prev => prev.filter(v => v.id !== id));
      return true;
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to delete vehicle.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getVehicleById = (id: string): Vehicle | undefined => {
    return vehicles.find(v => v.id === id);
  };

  const updateVehicleOdometer = async (vehicleId: string, newOdometer: number) => {
    return updateVehicle(vehicleId, { lastRecordedOdometer: newOdometer });
  };

  return {
    vehicles,
    isLoaded,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleById,
    updateVehicleOdometer,
    refetch: fetchVehicles,
  };
}
