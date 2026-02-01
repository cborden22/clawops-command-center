import { useMemo } from "react";
import { Location } from "@/hooks/useLocationsDB";
import { MileageRoute } from "@/hooks/useRoutesDB";
import { UserSchedule } from "@/hooks/useUserSchedules";
import { startOfDay, addDays, isSameDay, isAfter, isBefore, differenceInDays } from "date-fns";

export type TaskType = "collection" | "route" | "restock" | "maintenance";
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
  };
}

export interface CollectionStatus {
  locationId: string;
  locationName: string;
  frequencyDays: number;
  lastCollectionDate: Date | null;
  nextDueDate: Date;
  daysSinceCollection: number | null;
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
}

interface SmartSchedulerInput {
  locations: Location[];
  routes: MileageRoute[];
  userSchedules: UserSchedule[];
  maintenanceReports?: Array<{ id: string; status: string; machineId: string; description: string }>;
  lastCollectionDates?: Map<string, Date>;
}

function calculateNextDueDate(
  lastDate: Date | null,
  frequencyDays: number,
  dayOfWeek?: number | null
): Date {
  const today = startOfDay(new Date());
  
  if (!lastDate) {
    // No previous date, due today
    return today;
  }

  const nextDue = addDays(startOfDay(lastDate), frequencyDays);
  
  // If dayOfWeek is specified, adjust to that day
  if (dayOfWeek !== undefined && dayOfWeek !== null) {
    const currentDow = nextDue.getDay();
    let daysToAdd = dayOfWeek - currentDow;
    if (daysToAdd < 0) daysToAdd += 7;
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
  lastCollectionDates = new Map(),
}: SmartSchedulerInput) {
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);

  // Calculate collection statuses
  const collectionStatuses = useMemo((): CollectionStatus[] => {
    return locations
      .filter((loc) => loc.isActive)
      .map((loc) => {
        // Try to get frequency from location - we'll need to extend Location type
        // For now, check if the location has these properties (will be added after migration)
        const locationAny = loc as any;
        const frequencyDays = locationAny.collectionFrequencyDays;
        
        if (!frequencyDays) {
          return {
            locationId: loc.id,
            locationName: loc.name,
            frequencyDays: 0,
            lastCollectionDate: null,
            nextDueDate: today,
            daysSinceCollection: null,
            daysOverdue: 0,
            status: "no_schedule" as const,
          };
        }

        const lastCollection = locationAny.lastCollectionDate 
          ? new Date(locationAny.lastCollectionDate)
          : lastCollectionDates.get(loc.id) || null;
        
        const nextDueDate = calculateNextDueDate(lastCollection, frequencyDays);
        const daysSinceCollection = lastCollection 
          ? differenceInDays(today, startOfDay(lastCollection))
          : null;
        const daysOverdue = Math.max(0, differenceInDays(today, nextDueDate));

        return {
          locationId: loc.id,
          locationName: loc.name,
          frequencyDays,
          lastCollectionDate: lastCollection,
          nextDueDate,
          daysSinceCollection,
          daysOverdue,
          status: getTaskStatus(nextDueDate),
        };
      })
      .filter((s) => s.status !== "no_schedule");
  }, [locations, lastCollectionDates, today]);

  // Calculate route schedule statuses
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

        return {
          routeId: route.id,
          routeName: route.name,
          frequencyDays,
          dayOfWeek,
          nextScheduledDate: nextDate,
          status: getTaskStatus(nextDate),
        };
      })
      .filter((s): s is RouteScheduleStatus => s !== null);
  }, [routes, today]);

  // Get restock schedule
  const restockSchedule = useMemo(() => {
    const restockSched = userSchedules.find((s) => s.scheduleType === "restock");
    if (!restockSched || !restockSched.frequencyDays) return null;

    const nextDate = restockSched.nextScheduledDate || today;
    return {
      frequencyDays: restockSched.frequencyDays,
      dayOfWeek: restockSched.dayOfWeek,
      lastCompletedDate: restockSched.lastCompletedDate,
      nextScheduledDate: nextDate,
      status: getTaskStatus(nextDate),
    };
  }, [userSchedules, today]);

  // Generate all scheduled tasks for the week
  const weeklyTasks = useMemo((): ScheduledTask[] => {
    const tasks: ScheduledTask[] = [];

    // Add collection tasks
    collectionStatuses.forEach((status) => {
      if (
        status.status !== "no_schedule" &&
        (isBefore(status.nextDueDate, weekEnd) || isSameDay(status.nextDueDate, weekEnd))
      ) {
        tasks.push({
          id: `collection-${status.locationId}`,
          type: "collection",
          title: status.locationName,
          subtitle: `${status.daysOverdue > 0 ? `${status.daysOverdue} days overdue` : "Collection due"}`,
          dueDate: status.nextDueDate,
          status: status.status,
          priority: getPriority(status.status),
          link: "/locations",
          metadata: { locationId: status.locationId },
        });
      }
    });

    // Add route tasks
    routeScheduleStatuses.forEach((status) => {
      if (isBefore(status.nextScheduledDate, weekEnd) || isSameDay(status.nextScheduledDate, weekEnd)) {
        tasks.push({
          id: `route-${status.routeId}`,
          type: "route",
          title: status.routeName,
          subtitle: "Scheduled run",
          dueDate: status.nextScheduledDate,
          status: status.status,
          priority: getPriority(status.status),
          link: "/routes",
          metadata: { routeId: status.routeId },
        });
      }
    });

    // Add restock task
    if (restockSchedule) {
      const restockDate = restockSchedule.nextScheduledDate;
      if (isBefore(restockDate, weekEnd) || isSameDay(restockDate, weekEnd)) {
        tasks.push({
          id: "restock",
          type: "restock",
          title: "Restock Run",
          subtitle: "Scheduled supply run",
          dueDate: restockDate,
          status: restockSchedule.status,
          priority: getPriority(restockSchedule.status),
          link: "/inventory",
          metadata: { scheduleType: "restock" },
        });
      }
    }

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

    // Sort by date, then priority
    return tasks.sort((a, b) => {
      const dateDiff = a.dueDate.getTime() - b.dueDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [collectionStatuses, routeScheduleStatuses, restockSchedule, maintenanceReports, today, weekEnd]);

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

  // Get overdue collections specifically
  const overdueCollections = useMemo(() => {
    return collectionStatuses.filter((s) => s.status === "overdue");
  }, [collectionStatuses]);

  // Get due today collections
  const dueTodayCollections = useMemo(() => {
    return collectionStatuses.filter((s) => s.status === "due_today");
  }, [collectionStatuses]);

  return {
    collectionStatuses,
    routeScheduleStatuses,
    restockSchedule,
    weeklyTasks,
    tasksByDate,
    urgentTasks,
    overdueCollections,
    dueTodayCollections,
  };
}
