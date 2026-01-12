import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  location: string;
  lastUpdated: string;
  packageType: string;
  packageQuantity: number;
}

export interface StockRunHistoryItem {
  id: string;
  name: string;
  quantity: number;
}

export async function saveStockRunHistory(
  userId: string,
  items: StockRunHistoryItem[]
): Promise<string | null> {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalProducts = items.length;

  try {
    const { data, error } = await supabase
      .from("stock_run_history")
      .insert([{
        user_id: userId,
        total_items: totalItems,
        total_products: totalProducts,
        items: JSON.parse(JSON.stringify(items)),
      }])
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error("Error saving stock run history:", error);
    return null;
  }
}

export async function updateStockRunReturns(
  historyId: string,
  returnedItems: StockRunHistoryItem[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("stock_run_history")
      .update({ returned_items: JSON.parse(JSON.stringify(returnedItems)) })
      .eq("id", historyId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating stock run returns:", error);
    return false;
  }
}

export function useInventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchItems = async () => {
    if (!user) {
      setItems([]);
      setIsLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id)
        .order("last_updated", { ascending: false });

      if (error) throw error;

      const mappedItems: InventoryItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category || "",
        quantity: item.quantity || 0,
        minStock: item.min_stock || 5,
        location: item.location || "",
        lastUpdated: new Date(item.last_updated).toLocaleDateString(),
        packageType: item.package_type || "Case",
        packageQuantity: item.package_quantity || 24,
      }));

      setItems(mappedItems);
    } catch (error: any) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory.",
        variant: "destructive",
      });
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchItems();
    } else {
      setItems([]);
      setIsLoaded(true);
    }
  }, [user?.id]);

  const addItem = async (item: Omit<InventoryItem, "id" | "lastUpdated">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          user_id: user.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          min_stock: item.minStock,
          location: item.location,
          package_type: item.packageType,
          package_quantity: item.packageQuantity,
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: InventoryItem = {
        id: data.id,
        name: data.name,
        category: data.category || "",
        quantity: data.quantity || 0,
        minStock: data.min_stock || 5,
        location: data.location || "",
        lastUpdated: new Date(data.last_updated).toLocaleDateString(),
        packageType: data.package_type || "Case",
        packageQuantity: data.package_quantity || 24,
      };

      setItems(prev => [newItem, ...prev]);
      return newItem;
    } catch (error: any) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "Failed to add item.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!user) return;

    try {
      const updateData: any = { last_updated: new Date().toISOString() };
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.minStock !== undefined) updateData.min_stock = updates.minStock;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.packageType !== undefined) updateData.package_type = updates.packageType;
      if (updates.packageQuantity !== undefined) updateData.package_quantity = updates.packageQuantity;

      const { error } = await supabase
        .from("inventory_items")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setItems(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, ...updates, lastUpdated: new Date().toLocaleDateString() }
            : item
        )
      );
    } catch (error: any) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item.",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (id: string, change: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + change);
    await updateItem(id, { quantity: newQuantity });
  };

  const bulkDeductQuantities = async (deductions: { id: string; quantity: number }[]) => {
    if (!user) return false;

    try {
      // Update each item in parallel
      await Promise.all(
        deductions.map(async ({ id, quantity }) => {
          const item = items.find(i => i.id === id);
          if (!item) return;

          const newQuantity = Math.max(0, item.quantity - quantity);
          const { error } = await supabase
            .from("inventory_items")
            .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
            .eq("id", id);

          if (error) throw error;
        })
      );

      // Update local state
      setItems(prev =>
        prev.map(item => {
          const deduction = deductions.find(d => d.id === item.id);
          if (deduction) {
            return {
              ...item,
              quantity: Math.max(0, item.quantity - deduction.quantity),
              lastUpdated: new Date().toLocaleDateString(),
            };
          }
          return item;
        })
      );

      return true;
    } catch (error: any) {
      console.error("Error bulk updating inventory:", error);
      toast({
        title: "Error",
        description: "Failed to update inventory.",
        variant: "destructive",
      });
      return false;
    }
  };

  const bulkAddQuantities = async (additions: { id: string; quantity: number }[]) => {
    if (!user) return false;

    try {
      // Update each item in parallel
      await Promise.all(
        additions.map(async ({ id, quantity }) => {
          const item = items.find(i => i.id === id);
          if (!item) return;

          const newQuantity = item.quantity + quantity;
          const { error } = await supabase
            .from("inventory_items")
            .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
            .eq("id", id);

          if (error) throw error;
        })
      );

      // Update local state
      setItems(prev =>
        prev.map(item => {
          const addition = additions.find(a => a.id === item.id);
          if (addition) {
            return {
              ...item,
              quantity: item.quantity + addition.quantity,
              lastUpdated: new Date().toLocaleDateString(),
            };
          }
          return item;
        })
      );

      return true;
    } catch (error: any) {
      console.error("Error bulk adding inventory:", error);
      toast({
        title: "Error",
        description: "Failed to update inventory.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    items,
    isLoaded,
    addItem,
    updateItem,
    deleteItem,
    updateQuantity,
    bulkDeductQuantities,
    bulkAddQuantities,
    refetch: fetchItems,
  };
}
