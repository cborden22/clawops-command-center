import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type EntryType = "income" | "expense";

export interface RevenueEntry {
  id: string;
  type: EntryType;
  locationId: string;
  machineType?: string;
  date: Date;
  amount: number;
  category?: string;
  notes: string;
  receiptUrl?: string;
}

export function useRevenueEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchEntries = async () => {
    if (!user) {
      setEntries([]);
      setIsLoaded(true);
      return;
    }

    try {
      // RLS handles access control - owners see own data, team members see owner data via has_team_permission()
      const { data, error } = await supabase
        .from("revenue_entries")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      const mappedEntries: RevenueEntry[] = (data || []).map(e => ({
        id: e.id,
        type: e.type as EntryType,
        locationId: e.location_id || "",
        machineType: e.machine_type || undefined,
        date: new Date(e.date),
        amount: Number(e.amount) || 0,
        category: e.category || undefined,
        notes: e.notes || "",
        receiptUrl: e.receipt_url || undefined,
      }));

      setEntries(mappedEntries);
    } catch (error: any) {
      console.error("Error fetching revenue entries:", error);
      toast({
        title: "Error",
        description: "Failed to load revenue entries.",
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

  const addEntry = async (entry: Omit<RevenueEntry, "id">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("revenue_entries")
        .insert({
          user_id: user.id,
          type: entry.type,
          location_id: entry.locationId || null,
          machine_type: entry.machineType || null,
          date: entry.date.toISOString(),
          amount: entry.amount,
          category: entry.category || null,
          notes: entry.notes,
          receipt_url: entry.receiptUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry: RevenueEntry = {
        id: data.id,
        type: data.type as EntryType,
        locationId: data.location_id || "",
        machineType: data.machine_type || undefined,
        date: new Date(data.date),
        amount: Number(data.amount) || 0,
        category: data.category || undefined,
        notes: data.notes || "",
        receiptUrl: data.receipt_url || undefined,
      };

      setEntries(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (error: any) {
      console.error("Error adding entry:", error);
      toast({
        title: "Error",
        description: "Failed to add entry.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("revenue_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (error: any) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete entry.",
        variant: "destructive",
      });
    }
  };

  const updateEntry = async (id: string, updates: Partial<Omit<RevenueEntry, "id">>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("revenue_entries")
        .update({
          type: updates.type,
          location_id: updates.locationId !== undefined ? (updates.locationId || null) : undefined,
          machine_type: updates.machineType !== undefined ? (updates.machineType || null) : undefined,
          date: updates.date ? updates.date.toISOString() : undefined,
          amount: updates.amount,
          category: updates.category !== undefined ? (updates.category || null) : undefined,
          notes: updates.notes !== undefined ? updates.notes : undefined,
          receipt_url: updates.receiptUrl !== undefined ? (updates.receiptUrl || null) : undefined,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedEntry: RevenueEntry = {
        id: data.id,
        type: data.type as EntryType,
        locationId: data.location_id || "",
        machineType: data.machine_type || undefined,
        date: new Date(data.date),
        amount: Number(data.amount) || 0,
        category: data.category || undefined,
        notes: data.notes || "",
        receiptUrl: data.receipt_url || undefined,
      };

      setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
      return updatedEntry;
    } catch (error: any) {
      console.error("Error updating entry:", error);
      toast({
        title: "Error",
        description: "Failed to update entry.",
        variant: "destructive",
      });
      return null;
    }
  };

  const addExpense = async (
    locationId: string,
    amount: number,
    category: string,
    notes: string,
    date: Date = new Date(),
    receiptUrl?: string
  ) => {
    return addEntry({
      type: "expense",
      locationId,
      amount,
      category,
      notes,
      date,
      receiptUrl,
    });
  };
  const addIncome = async (
    locationId: string,
    amount: number,
    notes: string,
    date: Date = new Date(),
    machineType?: string
  ) => {
    return addEntry({
      type: "income",
      locationId,
      amount,
      notes,
      date,
      machineType,
    });
  };

  return {
    entries,
    isLoaded,
    addEntry,
    updateEntry,
    deleteEntry,
    addExpense,
    addIncome,
    refetch: fetchEntries,
  };
}

// Standalone function to add expense without hook (for use in components that don't need full state)
export async function addRevenueExpense(
  userId: string,
  locationId: string,
  amount: number,
  category: string,
  notes: string,
  date: Date = new Date()
) {
  const { data, error } = await supabase
    .from("revenue_entries")
    .insert({
      user_id: userId,
      type: "expense",
      location_id: locationId || null,
      amount,
      category,
      notes,
      date: date.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
