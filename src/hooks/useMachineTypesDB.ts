import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { toast } from "@/hooks/use-toast";
import { slugify } from "@/utils/slugify";

export interface CustomMachineType {
  id: string;
  typeKey: string;
  label: string;
  sortOrder: number;
}

export interface MachineTypeOption {
  value: string;
  label: string;
}

const DEFAULT_MACHINE_TYPES: { typeKey: string; label: string }[] = [
  { typeKey: "claw", label: "Claw Machine" },
  { typeKey: "mini_claw", label: "Mini Claw Machine" },
  { typeKey: "bulk", label: "Bulk Machine" },
  { typeKey: "clip", label: "Clip Machine" },
  { typeKey: "sticker", label: "Sticker Machine" },
  { typeKey: "other", label: "Other" },
];

export function useMachineTypesDB() {
  const { user } = useAuth();
  const { effectiveUserId } = useTeamContext();
  const [machineTypes, setMachineTypes] = useState<CustomMachineType[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const targetUserId = effectiveUserId || user?.id;

  const fetchTypes = useCallback(async () => {
    if (!targetUserId) {
      setMachineTypes([]);
      setIsLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("custom_machine_types")
        .select("*")
        .eq("user_id", targetUserId)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setMachineTypes(
          data.map((d: any) => ({
            id: d.id,
            typeKey: d.type_key,
            label: d.label,
            sortOrder: d.sort_order,
          }))
        );
      } else if (user?.id === targetUserId && !isSeeding) {
        // Seed defaults for the owner (not team members)
        await seedDefaults();
      } else {
        setMachineTypes([]);
      }
    } catch (error) {
      console.error("Error fetching machine types:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [targetUserId, user?.id, isSeeding]);

  const seedDefaults = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      const inserts = DEFAULT_MACHINE_TYPES.map((t, i) => ({
        user_id: user.id,
        type_key: t.typeKey,
        label: t.label,
        sort_order: i,
      }));

      const { data, error } = await supabase
        .from("custom_machine_types")
        .insert(inserts)
        .select();

      if (error) throw error;

      if (data) {
        setMachineTypes(
          data.map((d: any) => ({
            id: d.id,
            typeKey: d.type_key,
            label: d.label,
            sortOrder: d.sort_order,
          }))
        );
      }
    } catch (error) {
      console.error("Error seeding default machine types:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [targetUserId]);

  const addType = async (label: string): Promise<boolean> => {
    if (!user) return false;
    const typeKey = slugify(label).replace(/-/g, "_") || `custom_${Date.now()}`;

    // Check for duplicate
    if (machineTypes.some((t) => t.typeKey === typeKey)) {
      toast({
        title: "Duplicate Type",
        description: "A machine type with that name already exists.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const nextOrder = machineTypes.length > 0
        ? Math.max(...machineTypes.map((t) => t.sortOrder)) + 1
        : 0;

      const { error } = await supabase.from("custom_machine_types").insert({
        user_id: user.id,
        type_key: typeKey,
        label: label.trim(),
        sort_order: nextOrder,
      });

      if (error) throw error;
      await fetchTypes();
      return true;
    } catch (error: any) {
      console.error("Error adding machine type:", error);
      toast({
        title: "Error",
        description: "Failed to add machine type.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeType = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("custom_machine_types")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchTypes();
      return true;
    } catch (error: any) {
      console.error("Error removing machine type:", error);
      toast({
        title: "Error",
        description: "Failed to remove machine type.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Derive the options array for use in selects (replaces MACHINE_TYPE_OPTIONS)
  const machineTypeOptions: MachineTypeOption[] = machineTypes.map((t) => ({
    value: t.typeKey,
    label: t.label,
  }));

  // Fallback: if nothing loaded yet, return defaults so UI isn't empty
  const effectiveOptions: MachineTypeOption[] =
    machineTypeOptions.length > 0
      ? machineTypeOptions
      : DEFAULT_MACHINE_TYPES.map((t) => ({ value: t.typeKey, label: t.label }));

  return {
    machineTypes,
    machineTypeOptions: effectiveOptions,
    isLoaded,
    addType,
    removeType,
    refetch: fetchTypes,
  };
}
