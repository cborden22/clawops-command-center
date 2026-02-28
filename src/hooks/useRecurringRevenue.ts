import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, isBefore, startOfDay } from "date-fns";

export interface RecurringRevenueItem {
  id: string;
  locationId: string | null;
  amount: number;
  frequency: string;
  category: string;
  nextDueDate: string;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

export function useRecurringRevenue() {
  const { user } = useAuth();
  const [items, setItems] = useState<RecurringRevenueItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchItems = async () => {
    if (!user) { setItems([]); setIsLoaded(true); return; }
    try {
      const { data, error } = await supabase
        .from("recurring_revenue")
        .select("*")
        .order("next_due_date", { ascending: true });
      if (error) throw error;
      setItems((data || []).map(r => ({
        id: r.id,
        locationId: r.location_id,
        amount: Number(r.amount),
        frequency: r.frequency,
        category: r.category || "Flat Fee",
        nextDueDate: r.next_due_date,
        isActive: r.is_active,
        notes: r.notes || "",
        createdAt: r.created_at,
      })));
    } catch (e) {
      console.error("Error fetching recurring revenue:", e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => { if (user) fetchItems(); else { setItems([]); setIsLoaded(true); } }, [user?.id]);

  const addItem = async (item: Omit<RecurringRevenueItem, "id" | "createdAt">) => {
    if (!user) return;
    const { error } = await supabase.from("recurring_revenue").insert({
      user_id: user.id,
      location_id: item.locationId || null,
      amount: item.amount,
      frequency: item.frequency,
      category: item.category,
      next_due_date: item.nextDueDate,
      is_active: item.isActive,
      notes: item.notes,
    });
    if (error) { toast({ title: "Error", description: "Failed to add recurring entry.", variant: "destructive" }); return; }
    await fetchItems();
    toast({ title: "Recurring Entry Added" });
  };

  const deleteItem = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("recurring_revenue").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }); return; }
    await fetchItems();
    toast({ title: "Recurring Entry Removed" });
  };

  const toggleActive = async (id: string, active: boolean) => {
    if (!user) return;
    await supabase.from("recurring_revenue").update({ is_active: active }).eq("id", id);
    await fetchItems();
  };

  const getNextDate = (current: string, frequency: string): string => {
    const d = new Date(current + "T00:00:00");
    if (frequency === "weekly") d.setDate(d.getDate() + 7);
    else if (frequency === "biweekly") d.setDate(d.getDate() + 14);
    else d.setMonth(d.getMonth() + 1);
    return format(d, "yyyy-MM-dd");
  };

  const generateDueEntries = async () => {
    if (!user) return 0;
    const today = startOfDay(new Date());
    const dueItems = items.filter(i => i.isActive && isBefore(new Date(i.nextDueDate + "T00:00:00"), new Date(today.getTime() + 86400000)));
    
    if (dueItems.length === 0) return 0;

    let count = 0;
    for (const item of dueItems) {
      // Create revenue entry
      const { error: entryError } = await supabase.from("revenue_entries").insert({
        user_id: user.id,
        type: "income",
        location_id: item.locationId || null,
        amount: item.amount,
        date: item.nextDueDate,
        category: item.category,
        notes: `Auto-generated from recurring: ${item.notes}`.trim(),
      });
      if (entryError) { console.error("Error creating entry:", entryError); continue; }

      // Advance next due date
      const nextDate = getNextDate(item.nextDueDate, item.frequency);
      await supabase.from("recurring_revenue").update({ next_due_date: nextDate }).eq("id", item.id);
      count++;
    }

    await fetchItems();
    return count;
  };

  const dueCount = items.filter(i => i.isActive && isBefore(new Date(i.nextDueDate + "T00:00:00"), new Date(startOfDay(new Date()).getTime() + 86400000))).length;

  return { items, isLoaded, addItem, deleteItem, toggleActive, generateDueEntries, dueCount, refetch: fetchItems };
}
