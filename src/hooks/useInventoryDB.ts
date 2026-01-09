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

  return {
    items,
    isLoaded,
    addItem,
    updateItem,
    deleteItem,
    updateQuantity,
    refetch: fetchItems,
  };
}
