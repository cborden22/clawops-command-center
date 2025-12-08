import { useState, useEffect } from "react";

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
}

const ENTRIES_STORAGE_KEY = "clawops-revenue-entries-v2";

export function useRevenueEntries() {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setEntries((data || []).map((e: any) => ({ ...e, date: new Date(e.date) })));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  const addEntry = (entry: Omit<RevenueEntry, "id">) => {
    const newEntry: RevenueEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const addExpense = (
    locationId: string,
    amount: number,
    category: string,
    notes: string,
    date: Date = new Date()
  ) => {
    return addEntry({
      type: "expense",
      locationId,
      amount,
      category,
      notes,
      date,
    });
  };

  const addIncome = (
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
    deleteEntry,
    addExpense,
    addIncome,
  };
}

// Standalone function to add expense without hook (for use in components that don't need full state)
export function addRevenueExpense(
  locationId: string,
  amount: number,
  category: string,
  notes: string,
  date: Date = new Date()
) {
  const saved = localStorage.getItem(ENTRIES_STORAGE_KEY);
  const entries: RevenueEntry[] = saved
    ? JSON.parse(saved).map((e: any) => ({ ...e, date: new Date(e.date) }))
    : [];

  const newEntry: RevenueEntry = {
    id: crypto.randomUUID(),
    type: "expense",
    locationId,
    amount,
    category,
    notes,
    date,
  };

  entries.unshift(newEntry);
  localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  return newEntry;
}
