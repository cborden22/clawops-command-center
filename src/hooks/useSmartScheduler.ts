import { useMemo } from "react";
import { Location } from "@/hooks/useLocationsDB";
import { MileageRoute } from "@/hooks/useRoutesDB";
import { UserSchedule } from "@/hooks/useUserSchedules";
import { startOfDay, addDays, isSameDay, isAfter, isBefore, differenceInDays } from "date-fns";

export type TaskType = "restock" | "route" | "maintenance" | "followup" | "custom";
export type TaskStatus = "overdue" | "due_today" | "due_soon" | "upcoming";

export interface ScheduledTask {
  id: string;
  type: TaskType;
  title: string;
  subtitle?: string;
  dueDate: Date;
  status: TaskStatus;
  priority: "high" | "medium" | "low";
  link: string;
  metadata: {
    locationId?: string;
    routeId?: string;
    scheduleType?: string;
    leadId?: string;
    isCustom?: boolean;
  };
}

export interface RestockStatus {
  locationId: string;
  locationName: string;
  frequencyDays: number;
  dayOfWeek?: number;
  lastRestockDate: Date | null;
  nextDueDate: Date;
  daysSinceRestock: number | null;
  daysOverdue: number;
  status: TaskStatus | "no_schedule";
}

export interface RouteScheduleStatus {
  routeId: string;
  routeName: string;
  frequencyDays: number;
  dayOfWeek: number;
  nextScheduledDate: Date;
  status: TaskStatus;
  locationNames: string[];
}

export interface LeadFollowUp {
  id: string;
  business_name: string;
  next_follow_up: string | null;
  status: string;
  priority: string | null;
}

interface SmartSchedulerInput {
  locations: Location[];
  routes: MileageRoute[];
  userSchedules: UserSchedule[];
  maintenanceReports?: Array<{ id: string; status: string; machineId: string; description: string }>;
  lastRestockDates?: Map<string, Date>;
  leads?: LeadFollowUp[];
}

function calculateNextDueDate(
  lastDate: Date | null,
  frequencyDays: number,
  dayOfWeek?: number | null
): Date {
  const today = startOfDay(new Date());
  
  if (!lastDate) {
    // No previous date - find next occurrence of dayOfWeek if set
    if (dayOfWeek !== undefined && dayOfWeek !== null) {
      const currentDow = today.getDay();
      let daysToAdd = dayOfWeek - currentDow;
      if (daysToAdd < 0) daysToAdd += 7;
      return addDays(today, daysToAdd);
    }
    return today;
  }

  const nextDue = addDays(startOfDay(lastDate), frequencyDays);
  
  // If dayOfWeek is specified, adjust to that day
  if (dayOfWeek !== undefined && dayOfWeek !== null) {
    const currentDow = nextDue.getDay();
    let daysToAdd = dayOfWeek - currentDow;
    if (daysToAdd < 0) daysToAdd += 7;
    if (daysToAdd === 0 && isBefore(nextDue, today)) {
      daysToAdd = 7; // Next week
    }
    return addDays(nextDue, daysToAdd);
  }
  
  return nextDue;
}

function getTaskStatus(dueDate: Date): TaskStatus {
  const today = startOfDay(new Date());
  const dueDateNorm = startOfDay(dueDate);
  
  if (isBefore(dueDateNorm, today)) {
    return "overdue";
  }
  if (isSameDay(dueDateNorm, today)) {
    return "due_today";
  }
  if (isBefore(dueDateNorm, addDays(today, 2))) {
    return "due_soon";
  }
  return "upcoming";
}

function getPriority(status: TaskStatus): "high" | "medium" | "low" {
  switch (status) {
    case "overdue":
      return "high";
    case "due_today":
      return "high";
    case "due_soon":
      return "medium";
    default:
      return "low";
  }
}

export function useSmartScheduler({
  locations,
  routes,
  userSchedules,
  maintenanceReports = [],
  lastRestockDates = new Map(),
  leads = [],
}: SmartSchedulerInput) {
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);

  // Build a Set of location IDs that are stops on any scheduled route
  const routeBoundLocationIds = useMemo(() => {
    const ids = new Set<string>();
    routes.forEach((route) => {
      const routeAny = route as any;
      // Only include routes that have a schedule
      if (routeAny.scheduleFrequencyDays && routeAny.scheduleDayOfWeek !== undefined && routeAny.scheduleDayOfWeek !== null) {
        route.stops.forEach((stop) => {
          if (stop.locationId) {
            ids.add(stop.locationId);
          }
        });
      }
    });
    return ids;
  }, [routes]);

  // Calculate restock statuses - only for locations NOT in any scheduled route
  const restockStatuses = useMemo((): RestockStatus[] => {
    return locations
      .filter((loc) => loc.isActive)
      .filter((loc) => !routeBoundLocationIds.has(loc.id)) // Skip route-bound locations
      .map((loc) => {
        const locationAny = loc as any;
        const frequencyDays = locationAny.collectionFrequencyDays;
        const dayOfWeek = locationAny.restockDayOfWeek;
        
        if (!frequencyDays) {
          return {
            locationId: loc.id,
            locationName: loc.name,
            frequencyDays: 0,
            dayOfWeek: undefined,
            lastRestockDate: null,
            nextDueDate: today,
            daysSinceRestock: null,
            daysOverdue: 0,
            status: "no_schedule" as const,
          };
        }

        const lastRestock = locationAny.lastCollectionDate 
          ? new Date(locationAny.lastCollectionDate)
          : lastRestockDates.get(loc.id) || null;
        
        const nextDueDate = calculateNextDueDate(lastRestock, frequencyDays, dayOfWeek);
        const daysSinceRestock = lastRestock 
          ? differenceInDays(today, startOfDay(lastRestock))
          : null;
        const daysOverdue = Math.max(0, differenceInDays(today, nextDueDate));

        return {
          locationId: loc.id,
          locationName: loc.name,
          frequencyDays,
          dayOfWeek,
          lastRestockDate: lastRestock,
          nextDueDate,
          daysSinceRestock,
          daysOverdue,
          status: getTaskStatus(nextDueDate),
        };
      })
      .filter((s) => s.status !== "no_schedule");
  }, [locations, routeBoundLocationIds, lastRestockDates, today]);

  // Calculate route schedule statuses with location names
  const routeScheduleStatuses = useMemo((): RouteScheduleStatus[] => {
    return routes
      .map((route) => {
        const routeAny = route as any;
        const frequencyDays = routeAny.scheduleFrequencyDays;
        const dayOfWeek = routeAny.scheduleDayOfWeek;
        
        if (!frequencyDays || dayOfWeek === null || dayOfWeek === undefined) {
          return null;
        }

        // Calculate next scheduled date based on day of week
        let nextDate = new Date(today);
        const currentDow = nextDate.getDay();
        let daysUntil = dayOfWeek - currentDow;
        if (daysUntil < 0) daysUntil += 7;
        nextDate = addDays(nextDate, daysUntil);

        // Get location names for route stops
        const locationNames = route.stops
          .filter(s => s.locationId)
          .map(s => locations.find(l => l.id === s.locationId)?.name)
          .filter((name): name is string => Boolean(name));

        return {
          routeId: route.id,
          routeName: route.name,
          frequencyDays,
          dayOfWeek,
          nextScheduledDate: nextDate,
          status: getTaskStatus(nextDate),
          locationNames,
        };
      })
      .filter((s): s is RouteScheduleStatus => s !== null);
  }, [routes, locations, today]);

  // Generate all scheduled tasks for the week
  const weeklyTasks = useMemo((): ScheduledTask[] => {
    const tasks: ScheduledTask[] = [];

    // Add restock tasks (only for locations NOT in routes)
    restockStatuses.forEach((status) => {
      if (
        status.status !== "no_schedule" &&
        (isBefore(status.nextDueDate, weekEnd) || isSameDay(status.nextDueDate, weekEnd))
      ) {
        tasks.push({
          id: `restock-${status.locationId}`,
          type: "restock",
          title: status.locationName,
          subtitle: `${status.daysOverdue > 0 ? `${status.daysOverdue} days overdue` : "Restock due"}`,
          dueDate: status.nextDueDate,
          status: status.status,
          priority: getPriority(status.status),
          link: "/locations",
          metadata: { locationId: status.locationId },
        });
      }
    });

    // Add route tasks with location names
    routeScheduleStatuses.forEach((status) => {
      if (isBefore(status.nextScheduledDate, weekEnd) || isSameDay(status.nextScheduledDate, weekEnd)) {
        const subtitle = status.locationNames.length > 0 
          ? status.locationNames.join(", ")
          : "Scheduled run";
        
        tasks.push({
          id: `route-${status.routeId}`,
          type: "route",
          title: status.routeName,
          subtitle,
          dueDate: status.nextScheduledDate,
          status: status.status,
          priority: getPriority(status.status),
          link: "/mileage",
          metadata: { routeId: status.routeId },
        });
      }
    });

    // Add maintenance tasks (open/in-progress)
    maintenanceReports
      .filter((r) => r.status === "open" || r.status === "in_progress")
      .forEach((report) => {
        tasks.push({
          id: `maintenance-${report.id}`,
          type: "maintenance",
          title: "Maintenance",
          subtitle: report.description.substring(0, 30),
          dueDate: today, // Maintenance is always urgent
          status: "due_today",
          priority: "medium",
          link: "/maintenance",
          metadata: {},
        });
      });

    // Add lead follow-up tasks
    leads
      .filter((l) => l.next_follow_up && l.status !== "won" && l.status !== "lost")
      .forEach((lead) => {
        const followUpDate = startOfDay(new Date(lead.next_follow_up!));
        if (isBefore(followUpDate, weekEnd) || isSameDay(followUpDate, weekEnd)) {
          tasks.push({
            id: `followup-${lead.id}`,
            type: "followup",
            title: lead.business_name,
            subtitle: lead.priority === "hot" ? "Hot Lead" : "Follow-up",
            dueDate: followUpDate,
            status: getTaskStatus(followUpDate),
            priority: lead.priority === "hot" ? "high" : "medium",
            link: "/leads",
            metadata: { leadId: lead.id },
          });
        }
      });

    // Sort by date, then priority
    return tasks.sort((a, b) => {
      const dateDiff = a.dueDate.getTime() - b.dueDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [restockStatuses, routeScheduleStatuses, maintenanceReports, leads, today, weekEnd]);

  // Group tasks by date for calendar display
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, ScheduledTask[]>();
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dateKey = date.toISOString().split("T")[0];
      grouped.set(dateKey, []);
    }

    weeklyTasks.forEach((task) => {
      const dateKey = startOfDay(task.dueDate).toISOString().split("T")[0];
      const existing = grouped.get(dateKey) || [];
      existing.push(task);
      grouped.set(dateKey, existing);
    });

    return grouped;
  }, [weeklyTasks, today]);

  // Get urgent tasks (overdue + due today)
  const urgentTasks = useMemo(() => {
    return weeklyTasks.filter((t) => t.status === "overdue" || t.status === "due_today");
  }, [weeklyTasks]);

  // Get overdue restocks specifically
  const overdueRestocks = useMemo(() => {
    return restockStatuses.filter((s) => s.status === "overdue");
  }, [restockStatuses]);

  // Get due today restocks
  const dueTodayRestocks = useMemo(() => {
    return restockStatuses.filter((s) => s.status === "due_today");
  }, [restockStatuses]);

  return {
    restockStatuses,
    routeScheduleStatuses,
    weeklyTasks,
    tasksByDate,
    urgentTasks,
    overdueRestocks,
    dueTodayRestocks,
  };
}
