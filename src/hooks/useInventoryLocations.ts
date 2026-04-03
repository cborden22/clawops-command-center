import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { toast } from "@/hooks/use-toast";

export interface InventoryLocation {
  id: string;
  user_id: string;
  location_name: string;
  location_type: "warehouse" | "business_location";
  code: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type InventoryLocationInsert = Omit<InventoryLocation, "id" | "user_id" | "created_at" | "updated_at">;

export function useInventoryLocations() {
  const { user } = useAuth();
  const { effectiveUserId } = useTeamContext();
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocations = useCallback(async () => {
    if (!user) {
      setLocations([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("inventory_locations")
        .select("*")
        .order("location_name");

      if (error) throw error;
      setLocations((data || []) as InventoryLocation[]);
    } catch (error) {
      console.error("Error fetching inventory locations:", error);
      toast({ title: "Error", description: "Failed to load locations.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const addLocation = async (loc: InventoryLocationInsert) => {
    if (!user || !effectiveUserId) return null;

    try {
      const { data, error } = await supabase
        .from("inventory_locations")
        .insert({
          user_id: effectiveUserId,
          location_name: loc.location_name,
          location_type: loc.location_type,
          code: loc.code || null,
          address: loc.address || null,
          notes: loc.notes || null,
          active: loc.active,
        } as any)
        .select()
        .single();

      if (error) throw error;
      const newLoc = data as InventoryLocation;
      setLocations(prev => [...prev, newLoc].sort((a, b) => a.location_name.localeCompare(b.location_name)));
      return newLoc;
    } catch (error: any) {
      console.error("Error adding location:", error);
      toast({ title: "Error", description: error.message?.includes("idx_inventory_locations_user_code") ? "A location with that code already exists." : "Failed to add location.", variant: "destructive" });
      return null;
    }
  };

  const updateLocation = async (id: string, updates: Partial<InventoryLocationInsert>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("inventory_locations")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      setLocations(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      return true;
    } catch (error: any) {
      console.error("Error updating location:", error);
      toast({ title: "Error", description: "Failed to update location.", variant: "destructive" });
      return false;
    }
  };

  const deleteLocation = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("inventory_locations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setLocations(prev => prev.filter(l => l.id !== id));
      return true;
    } catch (error: any) {
      console.error("Error deleting location:", error);
      toast({ title: "Error", description: "Failed to delete location.", variant: "destructive" });
      return false;
    }
  };

  return { locations, isLoading, addLocation, updateLocation, deleteLocation, refetch: fetchLocations };
}
