import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useTeamContext } from "@/contexts/TeamContext";

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
  // Enhanced fields
  supplierUrl: string | null;
  supplierName: string | null;
  lastPrice: number | null;
  pricePerItem: number | null;
  notes: string | null;
}

export interface StockRunHistoryItem {
  id: string;
  name: string;
  quantity: number;
}

export async function saveStockRunHistory(
  userId: string,
  items: StockRunHistoryItem[],
  runDate?: Date
): Promise<string | null> {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalProducts = items.length;

  try {
    const insertData: {
      user_id: string;
      total_items: number;
      total_products: number;
      items: object[];
      run_date?: string;
    } = {
      user_id: userId,
      total_items: totalItems,
      total_products: totalProducts,
      items: items.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })),
    };

    // Use provided runDate or let database use default now()
    if (runDate) {
      insertData.run_date = runDate.toISOString();
    }

    const { data, error } = await supabase
      .from("stock_run_history")
      .insert([insertData as any])
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
  const { effectiveUserId } = useTeamContext();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchItems = async () => {
    if (!user) {
      setItems([]);
      setIsLoaded(true);
      return;
    }

    try {
      // RLS handles access control - owners see own data, team members see owner data via has_team_permission()
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
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
        supplierUrl: item.supplier_url || null,
        supplierName: item.supplier_name || null,
        lastPrice: item.last_price ? Number(item.last_price) : null,
        pricePerItem: item.price_per_item ? Number(item.price_per_item) : null,
        notes: item.notes || null,
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
    if (!user || !effectiveUserId) return null;

    try {
      // Calculate price per item if lastPrice and packageQuantity are provided
      const pricePerItem = item.lastPrice && item.packageQuantity 
        ? item.lastPrice / item.packageQuantity 
        : null;

      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          user_id: effectiveUserId,           // Owner's ID (for RLS visibility)
          created_by_user_id: user.id,        // Actual creator (for attribution)
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          min_stock: item.minStock,
          location: item.location,
          package_type: item.packageType,
          package_quantity: item.packageQuantity,
          supplier_url: item.supplierUrl,
          supplier_name: item.supplierName,
          last_price: item.lastPrice,
          price_per_item: pricePerItem,
          notes: item.notes,
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
        supplierUrl: data.supplier_url || null,
        supplierName: data.supplier_name || null,
        lastPrice: data.last_price ? Number(data.last_price) : null,
        pricePerItem: data.price_per_item ? Number(data.price_per_item) : null,
        notes: data.notes || null,
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
      if (updates.supplierUrl !== undefined) updateData.supplier_url = updates.supplierUrl;
      if (updates.supplierName !== undefined) updateData.supplier_name = updates.supplierName;
      if (updates.lastPrice !== undefined) updateData.last_price = updates.lastPrice;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      
      // Auto-calculate price per item when lastPrice or packageQuantity changes
      if (updates.lastPrice !== undefined || updates.packageQuantity !== undefined) {
        const item = items.find(i => i.id === id);
        const newLastPrice = updates.lastPrice !== undefined ? updates.lastPrice : item?.lastPrice;
        const newPackageQty = updates.packageQuantity !== undefined ? updates.packageQuantity : item?.packageQuantity;
        if (newLastPrice && newPackageQty) {
          updateData.price_per_item = newLastPrice / newPackageQty;
        }
      }

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
