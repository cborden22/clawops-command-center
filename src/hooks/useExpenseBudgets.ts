import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ExpenseBudget {
  id: string;
  category: string;
  monthlyBudget: number;
}

export function useExpenseBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<ExpenseBudget[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchBudgets = async () => {
    if (!user) { setBudgets([]); setIsLoaded(true); return; }
    try {
      const { data, error } = await supabase
        .from("expense_budgets")
        .select("*")
        .order("category");
      if (error) throw error;
      setBudgets((data || []).map(b => ({
        id: b.id,
        category: b.category,
        monthlyBudget: Number(b.monthly_budget),
      })));
    } catch (e) {
      console.error("Error fetching budgets:", e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => { fetchBudgets(); }, [user?.id]);

  const upsertBudget = async (category: string, monthlyBudget: number) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("expense_budgets")
        .upsert({
          user_id: user.id,
          category,
          monthly_budget: monthlyBudget,
        }, { onConflict: "user_id,category" });
      if (error) throw error;
      await fetchBudgets();
      toast({ title: "Budget Saved", description: `Budget for ${category} updated.` });
    } catch (e: any) {
      console.error("Error saving budget:", e);
      toast({ title: "Error", description: "Failed to save budget.", variant: "destructive" });
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("expense_budgets").delete().eq("id", id);
      if (error) throw error;
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      console.error("Error deleting budget:", e);
    }
  };

  return { budgets, isLoaded, upsertBudget, deleteBudget, refetch: fetchBudgets };
}
