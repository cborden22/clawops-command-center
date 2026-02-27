import { useMemo } from "react";
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, differenceInDays } from "date-fns";

interface HealthInput {
  entries: Array<{
    id: string;
    type: string;
    locationId: string;
    date: Date;
    amount: number;
  }>;
  locations: Array<{
    id: string;
    name: string;
    lastCollectionDate?: string | null;
    collectionFrequencyDays?: number | null;
    machines?: Array<{ id?: string; count: number }>;
  }>;
  collections: Array<{
    id: string;
    locationId: string;
    machineId: string;
    collectionDate: string | Date;
    coinsInserted: number;
    prizesWon: number;
  }>;
}

export interface MachinePerformance {
  machineId: string;
  locationName: string;
  weeklyRevenue: number;
  trend: "up" | "down" | "flat";
}

export interface LocationGrowth {
  locationId: string;
  locationName: string;
  currentMonth: number;
  previousMonth: number;
  growthPercent: number;
}

export function useBusinessHealth({ entries, locations, collections }: HealthInput) {
  return useMemo(() => {
    const now = new Date();

    // Revenue per machine per week (this week vs last week)
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);

    const thisWeekIncome = entries
      .filter(e => e.type === "income" && e.date >= thisWeekStart && e.date <= thisWeekEnd)
      .reduce((sum, e) => sum + e.amount, 0);

    const lastWeekIncome = entries
      .filter(e => e.type === "income" && e.date >= lastWeekStart && e.date <= lastWeekEnd)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalMachines = locations.reduce((sum, loc) => 
      sum + (loc.machines?.reduce((ms, m) => ms + m.count, 0) || 0), 0
    );

    const revenuePerMachineThisWeek = totalMachines > 0 ? thisWeekIncome / totalMachines : 0;
    const revenuePerMachineLastWeek = totalMachines > 0 ? lastWeekIncome / totalMachines : 0;

    // Collection streak - days since last missed collection
    let collectionStreak = 0;
    const activeLocationsWithSchedule = locations.filter(l => l.collectionFrequencyDays && l.collectionFrequencyDays > 0);
    if (activeLocationsWithSchedule.length > 0) {
      const allOnTrack = activeLocationsWithSchedule.every(loc => {
        if (!loc.lastCollectionDate) return false;
        const daysSince = differenceInDays(now, new Date(loc.lastCollectionDate));
        return daysSince <= (loc.collectionFrequencyDays || 7);
      });
      if (allOnTrack) {
        // Count consecutive days all locations have been on track
        collectionStreak = Math.min(
          ...activeLocationsWithSchedule.map(loc => {
            if (!loc.lastCollectionDate) return 0;
            return differenceInDays(now, new Date(loc.lastCollectionDate));
          })
        );
        // Invert: streak is how many days since we HAVEN'T missed
        collectionStreak = activeLocationsWithSchedule.reduce((min, loc) => {
          const freq = loc.collectionFrequencyDays || 7;
          const daysSince = loc.lastCollectionDate ? differenceInDays(now, new Date(loc.lastCollectionDate)) : freq + 1;
          return Math.min(min, freq - daysSince);
        }, 999);
        if (collectionStreak < 0) collectionStreak = 0;
      }
    }

    // Month-over-month growth per location
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const locationGrowth: LocationGrowth[] = locations.map(loc => {
      const currentMonth = entries
        .filter(e => e.type === "income" && e.locationId === loc.id && e.date >= thisMonthStart && e.date <= thisMonthEnd)
        .reduce((sum, e) => sum + e.amount, 0);
      const previousMonth = entries
        .filter(e => e.type === "income" && e.locationId === loc.id && e.date >= lastMonthStart && e.date <= lastMonthEnd)
        .reduce((sum, e) => sum + e.amount, 0);
      const growthPercent = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;
      return { locationId: loc.id, locationName: loc.name, currentMonth, previousMonth, growthPercent };
    }).filter(lg => lg.currentMonth > 0 || lg.previousMonth > 0)
      .sort((a, b) => b.growthPercent - a.growthPercent);

    // Underperforming locations (below average)
    const avgRevenue = locationGrowth.length > 0 
      ? locationGrowth.reduce((sum, lg) => sum + lg.currentMonth, 0) / locationGrowth.length 
      : 0;
    const underperformers = locationGrowth.filter(lg => lg.currentMonth < avgRevenue * 0.5 && avgRevenue > 0);

    // Overall MoM growth
    const totalThisMonth = entries
      .filter(e => e.type === "income" && e.date >= thisMonthStart && e.date <= thisMonthEnd)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalLastMonth = entries
      .filter(e => e.type === "income" && e.date >= lastMonthStart && e.date <= lastMonthEnd)
      .reduce((sum, e) => sum + e.amount, 0);
    const overallGrowth = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0;

    return {
      revenuePerMachineThisWeek,
      revenuePerMachineLastWeek,
      weekOverWeekChange: revenuePerMachineLastWeek > 0 
        ? ((revenuePerMachineThisWeek - revenuePerMachineLastWeek) / revenuePerMachineLastWeek) * 100 
        : 0,
      collectionStreak,
      locationGrowth,
      underperformers,
      overallGrowth,
      totalThisMonth,
      totalLastMonth,
    };
  }, [entries, locations, collections]);
}
