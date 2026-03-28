import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { toast } from "@/hooks/use-toast";

export interface Warehouse {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  isDefault: boolean;
  notes: string | null;
  createdAt: string;
}

export interface WarehouseZone {
  id: string;
  warehouseId: string;
  name: string;
  zoneType: "tote" | "shelf" | "bin" | "section" | "other";
  notes: string | null;
  createdAt: string;
}

export function useWarehouses() {
  const { user } = useAuth();
  const { effectiveUserId } = useTeamContext();
  const { settings: appSettings } = useAppSettings();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [zones, setZones] = useState<WarehouseZone[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasMigrated, setHasMigrated] = useState(false);

  const fetchWarehouses = useCallback(async () => {
    if (!user) {
      setWarehouses([]);
      setZones([]);
      setIsLoaded(true);
      return;
    }

    try {
      const [whRes, zoneRes] = await Promise.all([
        supabase.from("warehouses").select("*").order("is_default", { ascending: false }).order("name"),
        supabase.from("warehouse_zones").select("*").order("name"),
      ]);

      if (whRes.error) throw whRes.error;
      if (zoneRes.error) throw zoneRes.error;

      setWarehouses(
        (whRes.data || []).map((w: any) => ({
          id: w.id,
          name: w.name,
          address: w.address,
          city: w.city,
          state: w.state,
          zip: w.zip,
          isDefault: w.is_default,
          notes: w.notes,
          createdAt: w.created_at,
        }))
      );

      setZones(
        (zoneRes.data || []).map((z: any) => ({
          id: z.id,
          warehouseId: z.warehouse_id,
          name: z.name,
          zoneType: z.zone_type,
          notes: z.notes,
          createdAt: z.created_at,
        }))
      );
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  // Auto-migrate from localStorage on first load
  useEffect(() => {
    if (!isLoaded || hasMigrated || !user || !effectiveUserId) return;
    setHasMigrated(true);

    if (warehouses.length === 0 && appSettings.warehouseAddress) {
      // Create a default warehouse from localStorage settings
      (async () => {
        try {
          const { data, error } = await supabase
            .from("warehouses")
            .insert({
              user_id: effectiveUserId,
              name: "Main Warehouse",
              address: appSettings.warehouseAddress,
              city: appSettings.warehouseCity || null,
              state: appSettings.warehouseState || null,
              zip: appSettings.warehouseZip || null,
              is_default: true,
            } as any)
            .select()
            .single();

          if (error) throw error;

          setWarehouses([
            {
              id: data.id,
              name: data.name,
              address: data.address,
              city: data.city,
              state: data.state,
              zip: data.zip,
              isDefault: data.is_default,
              notes: data.notes,
              createdAt: data.created_at,
            },
          ]);
        } catch (err) {
          console.error("Error migrating warehouse from settings:", err);
        }
      })();
    }
  }, [isLoaded, hasMigrated, user, effectiveUserId, warehouses.length, appSettings]);

  useEffect(() => {
    if (user) fetchWarehouses();
    else {
      setWarehouses([]);
      setZones([]);
      setIsLoaded(true);
    }
  }, [user?.id, fetchWarehouses]);

  const defaultWarehouse = warehouses.find((w) => w.isDefault) || warehouses[0] || null;

  const getWarehouseAddress = (warehouse: Warehouse | null): string => {
    if (!warehouse) return "";
    return [warehouse.address, warehouse.city, warehouse.state, warehouse.zip]
      .filter(Boolean)
      .join(", ");
  };

  const addWarehouse = async (data: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    isDefault?: boolean;
    notes?: string;
  }) => {
    if (!user || !effectiveUserId) return null;

    try {
      // If setting as default, unset others first
      if (data.isDefault) {
        await supabase
          .from("warehouses")
          .update({ is_default: false } as any)
          .eq("user_id", effectiveUserId);
      }

      const { data: row, error } = await supabase
        .from("warehouses")
        .insert({
          user_id: effectiveUserId,
          name: data.name,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip: data.zip || null,
          is_default: data.isDefault ?? false,
          notes: data.notes || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      await fetchWarehouses();
      return row;
    } catch (error) {
      console.error("Error adding warehouse:", error);
      toast({ title: "Error", description: "Failed to add warehouse.", variant: "destructive" });
      return null;
    }
  };

  const updateWarehouse = async (id: string, data: Partial<Omit<Warehouse, "id" | "createdAt">>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.state !== undefined) updateData.state = data.state;
      if (data.zip !== undefined) updateData.zip = data.zip;
      if (data.notes !== undefined) updateData.notes = data.notes;

      if (data.isDefault === true && effectiveUserId) {
        // Unset other defaults
        await supabase
          .from("warehouses")
          .update({ is_default: false } as any)
          .eq("user_id", effectiveUserId);
        updateData.is_default = true;
      } else if (data.isDefault === false) {
        updateData.is_default = false;
      }

      const { error } = await supabase.from("warehouses").update(updateData).eq("id", id);
      if (error) throw error;

      await fetchWarehouses();
    } catch (error) {
      console.error("Error updating warehouse:", error);
      toast({ title: "Error", description: "Failed to update warehouse.", variant: "destructive" });
    }
  };

  const deleteWarehouse = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("warehouses").delete().eq("id", id);
      if (error) throw error;
      await fetchWarehouses();
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      toast({ title: "Error", description: "Failed to delete warehouse.", variant: "destructive" });
    }
  };

  // Zone CRUD
  const addZone = async (warehouseId: string, data: { name: string; zoneType: WarehouseZone["zoneType"]; notes?: string }) => {
    if (!user) return null;
    try {
      const { data: row, error } = await supabase
        .from("warehouse_zones")
        .insert({
          warehouse_id: warehouseId,
          name: data.name,
          zone_type: data.zoneType,
          notes: data.notes || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      await fetchWarehouses();
      return row;
    } catch (error) {
      console.error("Error adding zone:", error);
      toast({ title: "Error", description: "Failed to add zone.", variant: "destructive" });
      return null;
    }
  };

  const updateZone = async (id: string, data: { name?: string; zoneType?: WarehouseZone["zoneType"]; notes?: string }) => {
    if (!user) return;
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.zoneType !== undefined) updateData.zone_type = data.zoneType;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const { error } = await supabase.from("warehouse_zones").update(updateData).eq("id", id);
      if (error) throw error;
      await fetchWarehouses();
    } catch (error) {
      console.error("Error updating zone:", error);
      toast({ title: "Error", description: "Failed to update zone.", variant: "destructive" });
    }
  };

  const deleteZone = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("warehouse_zones").delete().eq("id", id);
      if (error) throw error;
      await fetchWarehouses();
    } catch (error) {
      console.error("Error deleting zone:", error);
      toast({ title: "Error", description: "Failed to delete zone.", variant: "destructive" });
    }
  };

  const getZonesForWarehouse = (warehouseId: string) => zones.filter((z) => z.warehouseId === warehouseId);

  return {
    warehouses,
    zones,
    isLoaded,
    defaultWarehouse,
    getWarehouseAddress,
    getZonesForWarehouse,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    addZone,
    updateZone,
    deleteZone,
    refetch: fetchWarehouses,
  };
}
