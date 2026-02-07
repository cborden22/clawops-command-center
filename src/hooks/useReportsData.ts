import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, parseISO, isWithinInterval } from "date-fns";

export type DateRangePreset = "today" | "this_week" | "this_month" | "last_month" | "this_quarter" | "this_year" | "all_time" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
  preset: DateRangePreset;
}

export function getDateRangeFromPreset(preset: DateRangePreset, customStart?: Date, customEnd?: Date): DateRange {
  const now = new Date();
  
  switch (preset) {
    case "today":
      return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date(), preset };
    case "this_week":
      return { start: startOfWeek(now), end: endOfWeek(now), preset };
    case "this_month":
      return { start: startOfMonth(now), end: endOfMonth(now), preset };
    case "last_month":
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth), preset };
    case "this_quarter":
      return { start: startOfQuarter(now), end: endOfQuarter(now), preset };
    case "this_year":
      return { start: startOfYear(now), end: endOfYear(now), preset };
    case "all_time":
      return { start: new Date(2020, 0, 1), end: now, preset };
    case "custom":
      return { start: customStart || subDays(now, 30), end: customEnd || now, preset };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now), preset: "this_month" };
  }
}

export function useReportsData(dateRange: DateRange) {
  const { user } = useAuth();

  // Fetch all locations - RLS handles access control
  const { data: locations = [] } = useQuery({
    queryKey: ["reports-locations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("locations")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all revenue entries - RLS handles access control
  const { data: revenueEntries = [] } = useQuery({
    queryKey: ["reports-revenue", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("revenue_entries")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all machines - RLS handles access control via location relationship
  const { data: machines = [] } = useQuery({
    queryKey: ["reports-machines", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("location_machines")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all collections
  const { data: collections = [] } = useQuery({
    queryKey: ["reports-collections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("machine_collections")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch inventory items - RLS handles access control
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["reports-inventory", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch stock run history
  const { data: stockRunHistory = [] } = useQuery({
    queryKey: ["reports-stock-runs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("stock_run_history")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch mileage entries
  const { data: mileageEntries = [] } = useQuery({
    queryKey: ["reports-mileage", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("mileage_entries")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ["reports-vehicles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch commission summaries - RLS handles access control via location relationship
  const { data: commissionSummaries = [] } = useQuery({
    queryKey: ["reports-commissions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("commission_summaries")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Filter data by date range
  const filteredData = useMemo(() => {
    const isInRange = (dateStr: string) => {
      try {
        const date = parseISO(dateStr);
        return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      } catch {
        return false;
      }
    };

    return {
      revenueEntries: revenueEntries.filter(e => isInRange(e.date)),
      collections: collections.filter(c => isInRange(c.collection_date)),
      stockRunHistory: stockRunHistory.filter(s => isInRange(s.run_date)),
      mileageEntries: mileageEntries.filter(m => isInRange(m.date)),
      commissionSummaries: commissionSummaries.filter(c => {
        try {
          const start = parseISO(c.start_date);
          const end = parseISO(c.end_date);
          return isWithinInterval(start, { start: dateRange.start, end: dateRange.end }) ||
                 isWithinInterval(end, { start: dateRange.start, end: dateRange.end });
        } catch {
          return false;
        }
      }),
    };
  }, [revenueEntries, collections, stockRunHistory, mileageEntries, commissionSummaries, dateRange]);

  // Location performance calculations
  const locationPerformance = useMemo(() => {
    return locations.map(loc => {
      const locRevenue = filteredData.revenueEntries.filter(e => e.location_id === loc.id);
      const income = locRevenue
        .filter(e => e.type === "income")
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const expenses = locRevenue
        .filter(e => e.type === "expense")
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const commissions = filteredData.commissionSummaries
        .filter(c => c.location_id === loc.id)
        .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
      
      return {
        ...loc,
        income,
        expenses,
        commissions,
        profit: income - expenses - commissions,
        machineCount: machines.filter(m => m.location_id === loc.id).length,
      };
    }).sort((a, b) => b.income - a.income);
  }, [locations, filteredData, machines]);

  // Machine performance calculations
  const machinePerformance = useMemo(() => {
    return machines.map(machine => {
      const machineCollections = filteredData.collections.filter(c => c.machine_id === machine.id);
      const totalCoins = machineCollections.reduce((sum, c) => sum + c.coins_inserted, 0);
      const costPerPlay = Number(machine.cost_per_play) || 0.50;
      const totalPlays = costPerPlay > 0 ? (totalCoins * 0.25) / costPerPlay : 0;
      const totalPrizes = machineCollections.reduce((sum, c) => sum + c.prizes_won, 0);
      const trueWinRate = totalPlays > 0 ? totalPrizes / totalPlays : 0;
      const expectedWinRate = machine.win_probability ? 1 / Number(machine.win_probability) : 0;
      
      const location = locations.find(l => l.id === machine.location_id);
      
      return {
        ...machine,
        locationName: location?.name || "Unknown",
        totalCoins,
        totalPlays,
        totalPrizes,
        trueWinRate,
        trueOdds: totalPrizes > 0 ? totalPlays / totalPrizes : 0,
        expectedWinRate,
        performance: expectedWinRate > 0 
          ? trueWinRate > expectedWinRate ? "hot" : trueWinRate < expectedWinRate * 0.8 ? "cold" : "normal"
          : "unknown",
        collectionCount: machineCollections.length,
      };
    }).sort((a, b) => b.totalCoins - a.totalCoins);
  }, [machines, filteredData.collections, locations]);

  // Financial summary
  const financialSummary = useMemo(() => {
    const income = filteredData.revenueEntries
      .filter(e => e.type === "income")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const expenses = filteredData.revenueEntries
      .filter(e => e.type === "expense")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const expensesByCategory: Record<string, number> = {};
    filteredData.revenueEntries
      .filter(e => e.type === "expense")
      .forEach(e => {
        const cat = e.category || "Other";
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(e.amount);
      });

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
      expensesByCategory,
      entryCount: filteredData.revenueEntries.length,
    };
  }, [filteredData.revenueEntries]);

  // Inventory analysis
  const inventoryAnalysis = useMemo(() => {
    const productUsage: Record<string, { name: string; totalUsed: number; runCount: number }> = {};
    
    filteredData.stockRunHistory.forEach(run => {
      const items = run.items as Array<{ id: string; name: string; quantity: number }>;
      items?.forEach(item => {
        if (!productUsage[item.id]) {
          productUsage[item.id] = { name: item.name, totalUsed: 0, runCount: 0 };
        }
        productUsage[item.id].totalUsed += item.quantity;
        productUsage[item.id].runCount++;
      });
    });

    const lowStockItems = inventoryItems.filter(
      item => (item.quantity || 0) <= (item.min_stock || 5)
    );

    const totalValue = inventoryItems.reduce((sum, item) => {
      return sum + (Number(item.quantity) || 0) * (Number(item.price_per_item) || 0);
    }, 0);

    const restockCost = inventoryItems.reduce((sum, item) => {
      const deficit = Math.max(0, (item.min_stock || 5) * 2 - (item.quantity || 0));
      return sum + deficit * (Number(item.price_per_item) || 0);
    }, 0);

    return {
      productUsage: Object.values(productUsage).sort((a, b) => b.totalUsed - a.totalUsed),
      lowStockItems,
      lowStockCount: lowStockItems.length,
      totalItems: inventoryItems.length,
      totalValue,
      restockCost,
      stockRunCount: filteredData.stockRunHistory.length,
    };
  }, [inventoryItems, filteredData.stockRunHistory]);

  // Mileage analysis
  const mileageAnalysis = useMemo(() => {
    const totalMiles = filteredData.mileageEntries.reduce((sum, e) => sum + Number(e.miles), 0);
    const IRS_RATE = 0.67; // 2024 IRS rate
    const taxDeduction = totalMiles * IRS_RATE;

    const milesByPurpose: Record<string, number> = {};
    filteredData.mileageEntries.forEach(e => {
      const purpose = e.purpose || "Other";
      milesByPurpose[purpose] = (milesByPurpose[purpose] || 0) + Number(e.miles);
    });

    const milesByVehicle: Record<string, { name: string; miles: number; trips: number }> = {};
    filteredData.mileageEntries.forEach(e => {
      const vehicle = vehicles.find(v => v.id === e.vehicle_id);
      const vehicleName = vehicle?.name || "Unassigned";
      if (!milesByVehicle[vehicleName]) {
        milesByVehicle[vehicleName] = { name: vehicleName, miles: 0, trips: 0 };
      }
      milesByVehicle[vehicleName].miles += Number(e.miles);
      milesByVehicle[vehicleName].trips++;
    });

    const locationVisits: Record<string, number> = {};
    filteredData.mileageEntries.forEach(e => {
      if (e.location_id) {
        locationVisits[e.location_id] = (locationVisits[e.location_id] || 0) + 1;
      }
    });

    return {
      totalMiles,
      taxDeduction,
      tripCount: filteredData.mileageEntries.length,
      milesByPurpose,
      milesByVehicle: Object.values(milesByVehicle).sort((a, b) => b.miles - a.miles),
      locationVisits,
      avgMilesPerTrip: filteredData.mileageEntries.length > 0 
        ? totalMiles / filteredData.mileageEntries.length 
        : 0,
    };
  }, [filteredData.mileageEntries, vehicles]);

  // Win rate analysis
  const winRateAnalysis = useMemo(() => {
    const totalCoins = filteredData.collections.reduce((sum, c) => sum + c.coins_inserted, 0);
    const totalPrizes = filteredData.collections.reduce((sum, c) => sum + c.prizes_won, 0);
    
    // Calculate total plays considering different cost per play
    let totalPlays = 0;
    filteredData.collections.forEach(c => {
      const machine = machines.find(m => m.id === c.machine_id);
      const costPerPlay = Number(machine?.cost_per_play) || 0.50;
      totalPlays += (c.coins_inserted * 0.25) / costPerPlay;
    });

    const overallWinRate = totalPlays > 0 ? totalPrizes / totalPlays : 0;
    const overallOdds = totalPrizes > 0 ? totalPlays / totalPrizes : 0;

    // Win rate by location
    const winRateByLocation = locations.map(loc => {
      const locCollections = filteredData.collections.filter(c => c.location_id === loc.id);
      let locPlays = 0;
      let locPrizes = 0;
      
      locCollections.forEach(c => {
        const machine = machines.find(m => m.id === c.machine_id);
        const costPerPlay = Number(machine?.cost_per_play) || 0.50;
        locPlays += (c.coins_inserted * 0.25) / costPerPlay;
        locPrizes += c.prizes_won;
      });

      return {
        locationId: loc.id,
        locationName: loc.name,
        plays: locPlays,
        prizes: locPrizes,
        winRate: locPlays > 0 ? locPrizes / locPlays : 0,
        odds: locPrizes > 0 ? locPlays / locPrizes : 0,
      };
    }).filter(l => l.plays > 0).sort((a, b) => b.winRate - a.winRate);

    return {
      totalCollections: filteredData.collections.length,
      totalCoins,
      totalPlays,
      totalPrizes,
      overallWinRate,
      overallOdds,
      winRateByLocation,
      hotMachines: machinePerformance.filter(m => m.performance === "hot").length,
      coldMachines: machinePerformance.filter(m => m.performance === "cold").length,
    };
  }, [filteredData.collections, machines, locations, machinePerformance]);

  return {
    locations,
    machines,
    vehicles,
    inventoryItems,
    locationPerformance,
    machinePerformance,
    financialSummary,
    inventoryAnalysis,
    mileageAnalysis,
    winRateAnalysis,
    filteredData,
    isLoading: !user,
  };
}

export type ReportsData = ReturnType<typeof useReportsData>;
