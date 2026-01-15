import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface MachineCollection {
  id: string;
  userId: string;
  locationId: string;
  machineId: string;
  revenueEntryId?: string;
  collectionDate: Date;
  coinsInserted: number;
  prizesWon: number;
  meterReadingStart?: number;
  meterReadingEnd?: number;
  notes?: string;
  createdAt: string;
}

export interface CollectionInput {
  locationId: string;
  machineId: string;
  revenueEntryId?: string;
  collectionDate: Date;
  coinsInserted: number;
  prizesWon: number;
  meterReadingStart?: number;
  meterReadingEnd?: number;
  notes?: string;
}

export interface MachineStats {
  machineId: string;
  totalCoinsInserted: number;
  totalPrizesWon: number;
  collectionCount: number;
  actualWinRate: number; // as decimal (e.g., 0.0667 = 6.67%)
  actualOdds: number; // "1 in X" format (e.g., 15)
}

export function useMachineCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<MachineCollection[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchCollections = async () => {
    if (!user) {
      setCollections([]);
      setIsLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("machine_collections")
        .select("*")
        .eq("user_id", user.id)
        .order("collection_date", { ascending: false });

      if (error) throw error;

      const mapped: MachineCollection[] = (data || []).map((c) => ({
        id: c.id,
        userId: c.user_id,
        locationId: c.location_id,
        machineId: c.machine_id,
        revenueEntryId: c.revenue_entry_id || undefined,
        collectionDate: new Date(c.collection_date),
        coinsInserted: c.coins_inserted,
        prizesWon: c.prizes_won,
        meterReadingStart: c.meter_reading_start || undefined,
        meterReadingEnd: c.meter_reading_end || undefined,
        notes: c.notes || undefined,
        createdAt: c.created_at,
      }));

      setCollections(mapped);
    } catch (error: any) {
      console.error("Error fetching machine collections:", error);
      toast({
        title: "Error",
        description: "Failed to load machine collection data.",
        variant: "destructive",
      });
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCollections();
    } else {
      setCollections([]);
      setIsLoaded(true);
    }
  }, [user?.id]);

  const addCollection = async (input: CollectionInput): Promise<MachineCollection | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("machine_collections")
        .insert({
          user_id: user.id,
          location_id: input.locationId,
          machine_id: input.machineId,
          revenue_entry_id: input.revenueEntryId || null,
          collection_date: input.collectionDate.toISOString(),
          coins_inserted: input.coinsInserted,
          prizes_won: input.prizesWon,
          meter_reading_start: input.meterReadingStart || null,
          meter_reading_end: input.meterReadingEnd || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchCollections();

      return {
        id: data.id,
        userId: data.user_id,
        locationId: data.location_id,
        machineId: data.machine_id,
        revenueEntryId: data.revenue_entry_id || undefined,
        collectionDate: new Date(data.collection_date),
        coinsInserted: data.coins_inserted,
        prizesWon: data.prizes_won,
        meterReadingStart: data.meter_reading_start || undefined,
        meterReadingEnd: data.meter_reading_end || undefined,
        notes: data.notes || undefined,
        createdAt: data.created_at,
      };
    } catch (error: any) {
      console.error("Error adding machine collection:", error);
      toast({
        title: "Error",
        description: "Failed to save collection metrics.",
        variant: "destructive",
      });
      return null;
    }
  };

  const getCollectionsForMachine = (machineId: string): MachineCollection[] => {
    return collections.filter((c) => c.machineId === machineId);
  };

  const getCollectionsForLocation = (locationId: string): MachineCollection[] => {
    return collections.filter((c) => c.locationId === locationId);
  };

  const calculateMachineStats = (machineId: string): MachineStats => {
    const machineCollections = getCollectionsForMachine(machineId);

    const totalCoinsInserted = machineCollections.reduce((sum, c) => sum + c.coinsInserted, 0);
    const totalPrizesWon = machineCollections.reduce((sum, c) => sum + c.prizesWon, 0);
    const collectionCount = machineCollections.length;

    // Calculate actual win rate
    const actualWinRate = totalCoinsInserted > 0 ? totalPrizesWon / totalCoinsInserted : 0;
    const actualOdds = actualWinRate > 0 ? 1 / actualWinRate : 0;

    return {
      machineId,
      totalCoinsInserted,
      totalPrizesWon,
      collectionCount,
      actualWinRate,
      actualOdds,
    };
  };

  // Calculate win rate for a single collection
  const calculateCollectionWinRate = (coinsInserted: number, prizesWon: number) => {
    if (coinsInserted <= 0) return { winRate: 0, odds: 0 };
    const winRate = prizesWon / coinsInserted;
    const odds = winRate > 0 ? 1 / winRate : 0;
    return { winRate, odds };
  };

  // Format win rate for display
  const formatWinRate = (winRate: number): string => {
    if (winRate <= 0) return "N/A";
    return `${(winRate * 100).toFixed(1)}%`;
  };

  // Format odds for display (e.g., "1 in 15")
  const formatOdds = (odds: number): string => {
    if (odds <= 0) return "N/A";
    return `1 in ${Math.round(odds)}`;
  };

  // Compare actual vs expected and get status
  const compareToExpected = (actualWinRate: number, expectedProbability: number): {
    status: "over" | "under" | "on-target" | "unknown";
    variance: number;
    message: string;
  } => {
    if (!expectedProbability || expectedProbability <= 0) {
      return { status: "unknown", variance: 0, message: "No expected probability set" };
    }

    // expectedProbability is stored as "1 in X", so expected win rate is 1/X
    const expectedWinRate = 1 / expectedProbability;
    const variance = actualWinRate - expectedWinRate;
    const variancePercent = Math.abs(variance / expectedWinRate) * 100;

    // Within 10% is considered on-target
    if (variancePercent <= 10) {
      return { status: "on-target", variance: variancePercent, message: "Running on target" };
    }

    if (variance > 0) {
      return { 
        status: "over", 
        variance: variancePercent, 
        message: `Paying out ${variancePercent.toFixed(0)}% more than expected` 
      };
    } else {
      return { 
        status: "under", 
        variance: variancePercent, 
        message: `Paying out ${variancePercent.toFixed(0)}% less than expected` 
      };
    }
  };

  // Calculate location-wide stats
  const calculateLocationStats = (locationId: string) => {
    const locationCollections = getCollectionsForLocation(locationId);
    const totalCoins = locationCollections.reduce((sum, c) => sum + c.coinsInserted, 0);
    const totalPrizes = locationCollections.reduce((sum, c) => sum + c.prizesWon, 0);
    const winRate = totalCoins > 0 ? totalPrizes / totalCoins : 0;
    return {
      collectionCount: locationCollections.length,
      totalCoins,
      totalPrizes,
      winRate,
      odds: winRate > 0 ? 1 / winRate : 0,
    };
  };

  // Group collections by date for mobile view
  const getCollectionsGroupedByDate = () => {
    const grouped: Record<string, MachineCollection[]> = {};
    collections.forEach((c) => {
      const dateKey = c.collectionDate.toISOString().split("T")[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(c);
    });
    return grouped;
  };

  // Delete a collection
  const deleteCollection = async (collectionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("machine_collections")
        .delete()
        .eq("id", collectionId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchCollections();
      toast({ title: "Collection deleted" });
      return true;
    } catch (error: any) {
      console.error("Error deleting collection:", error);
      toast({
        title: "Error",
        description: "Failed to delete collection.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    collections,
    isLoaded,
    addCollection,
    deleteCollection,
    getCollectionsForMachine,
    getCollectionsForLocation,
    calculateMachineStats,
    calculateLocationStats,
    getCollectionsGroupedByDate,
    calculateCollectionWinRate,
    formatWinRate,
    formatOdds,
    compareToExpected,
    refetch: fetchCollections,
  };
}
