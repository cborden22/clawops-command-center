import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { toast } from "@/hooks/use-toast";

export interface InventoryBalance {
  id: string;
  user_id: string;
  inventory_item_id: string;
  location_id: string;
  quantity_on_hand: number;
  reorder_point: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useInventoryBalances() {
  const { user } = useAuth();
  const { effectiveUserId } = useTeamContext();
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalances = useCallback(async () => {
    if (!user) {
      setBalances([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("inventory_balances")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBalances((data || []) as InventoryBalance[]);
    } catch (error) {
      console.error("Error fetching inventory balances:", error);
      toast({ title: "Error", description: "Failed to load inventory balances.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const addBalance = async (itemId: string, locationId: string, qty: number, reorderPoint?: number | null, notes?: string | null) => {
    if (!user || !effectiveUserId) return null;

    try {
      const { data, error } = await supabase
        .from("inventory_balances")
        .insert({
          user_id: effectiveUserId,
          inventory_item_id: itemId,
          location_id: locationId,
          quantity_on_hand: qty,
          reorder_point: reorderPoint ?? null,
          notes: notes ?? null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      const newBalance = data as InventoryBalance;
      setBalances(prev => [newBalance, ...prev]);
      return newBalance;
    } catch (error: any) {
      console.error("Error adding balance:", error);
      const msg = error.message?.includes("inventory_balances_inventory_item_id_location_id_key")
        ? "This item is already assigned to that location."
        : "Failed to add inventory balance.";
      toast({ title: "Error", description: msg, variant: "destructive" });
      return null;
    }
  };

  const updateBalance = async (id: string, updates: { quantity_on_hand?: number; reorder_point?: number | null; notes?: string | null }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("inventory_balances")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      setBalances(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
      return true;
    } catch (error) {
      console.error("Error updating balance:", error);
      toast({ title: "Error", description: "Failed to update balance.", variant: "destructive" });
      return false;
    }
  };

  const deleteBalance = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("inventory_balances")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setBalances(prev => prev.filter(b => b.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting balance:", error);
      toast({ title: "Error", description: "Failed to delete balance.", variant: "destructive" });
      return false;
    }
  };

  // Helper: get balances for a specific item
  const getBalancesForItem = useCallback((itemId: string) => {
    return balances.filter(b => b.inventory_item_id === itemId);
  }, [balances]);

  // Helper: get balances for a specific location
  const getBalancesForLocation = useCallback((locationId: string) => {
    return balances.filter(b => b.location_id === locationId);
  }, [balances]);

  // Helper: get total quantity across all locations for an item
  const getTotalQuantity = useCallback((itemId: string) => {
    return balances
      .filter(b => b.inventory_item_id === itemId)
      .reduce((sum, b) => sum + b.quantity_on_hand, 0);
  }, [balances]);

  // Helper: get location count for an item
  const getLocationCount = useCallback((itemId: string) => {
    return balances.filter(b => b.inventory_item_id === itemId && b.quantity_on_hand > 0).length;
  }, [balances]);

  return {
    balances,
    isLoading,
    addBalance,
    updateBalance,
    deleteBalance,
    getBalancesForItem,
    getBalancesForLocation,
    getTotalQuantity,
    getLocationCount,
    refetch: fetchBalances,
  };
}
