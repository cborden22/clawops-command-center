import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const STANDARD_CATEGORIES = [
  "Plush",
  "Candy",
  "Electronics",
  "Figurines",
  "Keychains",
  "Balls",
  "Capsules",
  "Parts",
  "Supplies",
  "General",
];

interface CustomCategory {
  id: string;
  name: string;
}

export function useCustomCategories() {
  const { user } = useAuth();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("custom_categories")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name");

    if (!error && data) {
      setCustomCategories(data);
    }
    setIsLoaded(true);
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const allCategories = [
    ...STANDARD_CATEGORIES,
    ...customCategories.map((c) => c.name).filter((n) => !STANDARD_CATEGORIES.includes(n)),
  ];

  const addCategory = async (name: string): Promise<boolean> => {
    if (!user) return false;
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (allCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: "Category exists", description: `"${trimmed}" already exists.`, variant: "destructive" });
      return false;
    }
    const { error } = await supabase
      .from("custom_categories")
      .insert({ user_id: user.id, name: trimmed });

    if (error) {
      toast({ title: "Error", description: "Failed to add category.", variant: "destructive" });
      return false;
    }
    await fetchCategories();
    toast({ title: "Category added", description: `"${trimmed}" is now available.` });
    return true;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("custom_categories").delete().eq("id", id);
    if (!error) {
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return { allCategories, customCategories, isLoaded, addCategory, deleteCategory };
}
