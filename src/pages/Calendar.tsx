import { useState, useMemo } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, Car, Wrench, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocations } from "@/hooks/useLocationsDB";
import { useRoutes } from "@/hooks/useRoutesDB";
import { useLeadsDB } from "@/hooks/useLeadsDB";
import { useMaintenanceReports } from "@/hooks/useMaintenanceReports";
import { useSmartScheduler, ScheduledTask, TaskType } from "@/hooks/useSmartScheduler";
import { cn } from "@/lib/utils";

const taskTypeConfig: Record<TaskType, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  restock: { icon: Package, color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30", label: "Restock" },
  route: { icon: Car, color: "bg-blue-500/20 text-blue-600 border-blue-500/30", label: "Route" },
  maintenance: { icon: Wrench, color: "bg-orange-500/20 text-orange-600 border-orange-500/30", label: "Maintenance" },
  followup: { icon: Users, color: "bg-amber-500/20 text-amber-600 border-amber-500/30", label: "Follow-up" },
};

export default function Calendar() {
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch data from existing hooks
  const { locations } = useLocations();
  const { routes } = useRoutes();
  const { leads } = useLeadsDB();
  const { reports } = useMaintenanceReports();

  // Get scheduled tasks from smart scheduler
  const { weeklyTasks, restockStatuses, routeScheduleStatuses } = useSmartScheduler({
    locations,
    routes,
    userSchedules: [],
    maintenanceReports: reports.map(r => ({
      id: r.id,
      status: r.status,
      machineId: r.machine_id,
      description: r.description,
    })),
    leads: leads.map(l => ({
      id: l.id,
      business_name: l.business_name,
      next_follow_up: l.next_follow_up,
      status: l.status,
      priority: l.priority,
    })),
  });

  // Generate all tasks for the current month view (extend beyond just 7 days)
  const monthlyTasks = useMemo(() => {
    const tasks: ScheduledTask[] = [];
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    // Add restock tasks for the month
    restockStatuses.forEach((status) => {
      if (status.status !== "no_schedule") {
        // For monthly view, we need to calculate occurrences within the month
        let nextDue = status.nextDueDate;
        while (nextDue <= monthEnd) {
          if (nextDue >= monthStart) {
            tasks.push({
              id: `restock-${status.locationId}-${nextDue.toISOString()}`,
              type: "restock",
              title: status.locationName,
              subtitle: "Restock due",
              dueDate: nextDue,
              status: "upcoming",
              priority: "medium",
              link: "/locations",
              metadata: { locationId: status.locationId },
            });
          }
          nextDue = addDays(nextDue, status.frequencyDays);
        }
      }
    });

    // Add route tasks for the month
    routeScheduleStatuses.forEach((status) => {
      let nextDate = status.nextScheduledDate;
      while (nextDate <= monthEnd) {
        if (nextDate >= monthStart) {
          tasks.push({
            id: `route-${status.routeId}-${nextDate.toISOString()}`,
            type: "route",
            title: status.routeName,
            subtitle: status.locationNames.join(", ") || "Scheduled run",
            dueDate: nextDate,
            status: "upcoming",
            priority: "medium",
            link: "/mileage",
            metadata: { routeId: status.routeId },
          });
        }
        nextDate = addDays(nextDate, 7); // Weekly routes
      }
    });

    // Add maintenance tasks (these are urgent, shown on today)
    reports
      .filter((r) => r.status === "open" || r.status === "in_progress")
      .forEach((report) => {
        tasks.push({
          id: `maintenance-${report.id}`,
          type: "maintenance",
          title: "Maintenance",
          subtitle: report.description.substring(0, 30),
          dueDate: new Date(),
          status: "due_today",
          priority: "medium",
          link: "/maintenance",
          metadata: {},
        });
      });

    // Add lead follow-ups
    leads
      .filter((l) => l.next_follow_up && l.status !== "won" && l.status !== "lost")
      .forEach((lead) => {
        const followUpDate = new Date(lead.next_follow_up!);
        if (followUpDate >= monthStart && followUpDate <= monthEnd) {
          tasks.push({
            id: `followup-${lead.id}`,
            type: "followup",
            title: lead.business_name,
            subtitle: lead.priority === "hot" ? "Hot Lead" : "Follow-up",
            dueDate: followUpDate,
            status: "upcoming",
            priority: lead.priority === "hot" ? "high" : "medium",
            link: "/leads",
            metadata: { leadId: lead.id },
          });
        }
      });

    return tasks;
  }, [currentDate, restockStatuses, routeScheduleStatuses, reports, leads]);

  // Group tasks by date for calendar display
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, ScheduledTask[]>();
    monthlyTasks.forEach((task) => {
      const dateKey = format(task.dueDate, "yyyy-MM-dd");
      const existing = grouped.get(dateKey) || [];
      existing.push(task);
      grouped.set(dateKey, existing);
    });
    return grouped;
  }, [monthlyTasks]);

  // Get calendar days for month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Get week days for week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentDate]);

  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getTasksForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return tasksByDate.get(dateKey) || [];
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
            Calendar
          </h1>
          <p className="text-muted-foreground">
            View and manage your scheduled tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "week")}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">
          {viewMode === "month" 
            ? format(currentDate, "MMMM yyyy")
            : `Week of ${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d, yyyy")}`
          }
        </h2>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            {viewMode === "month" ? (
              <>
                {/* Month View Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Month View Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dayTasks = getTasksForDate(day);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "min-h-[80px] p-1 text-left border rounded-lg transition-all hover:bg-accent/50",
                          !isCurrentMonth && "opacity-40",
                          isToday && "border-gold-500 bg-gold-500/10",
                          isSelected && "ring-2 ring-gold-500"
                        )}
                      >
                        <div className={cn(
                          "text-sm font-medium mb-1",
                          isToday && "text-gold-500"
                        )}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-0.5">
                          {dayTasks.slice(0, 3).map((task) => {
                            const config = taskTypeConfig[task.type];
                            return (
                              <div
                                key={task.id}
                                className={cn(
                                  "text-xs px-1 py-0.5 rounded truncate border",
                                  config.color
                                )}
                              >
                                {task.title}
                              </div>
                            );
                          })}
                          {dayTasks.length > 3 && (
                            <div className="text-xs text-muted-foreground px-1">
                              +{dayTasks.length - 3} more
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Week View */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const dayTasks = getTasksForDate(day);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "min-h-[300px] p-2 text-left border rounded-lg transition-all hover:bg-accent/50",
                          isToday && "border-gold-500 bg-gold-500/10",
                          isSelected && "ring-2 ring-gold-500"
                        )}
                      >
                        <div className="text-center mb-2">
                          <div className="text-xs text-muted-foreground">
                            {format(day, "EEE")}
                          </div>
                          <div className={cn(
                            "text-lg font-semibold",
                            isToday && "text-gold-500"
                          )}>
                            {format(day, "d")}
                          </div>
                        </div>
                        <ScrollArea className="h-[240px]">
                          <div className="space-y-1">
                            {dayTasks.map((task) => {
                              const config = taskTypeConfig[task.type];
                              const Icon = config.icon;
                              return (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "text-xs p-2 rounded border",
                                    config.color
                                  )}
                                >
                                  <div className="flex items-center gap-1 font-medium">
                                    <Icon className="h-3 w-3" />
                                    {task.title}
                                  </div>
                                  {task.subtitle && (
                                    <div className="text-xs opacity-80 truncate mt-0.5">
                                      {task.subtitle}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gold-500" />
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a day"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {selectedDate ? (
                selectedDateTasks.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateTasks.map((task) => {
                      const config = taskTypeConfig[task.type];
                      const Icon = config.icon;
                      return (
                        <Card key={task.id} className={cn("border", config.color)}>
                          <CardContent className="p-3">
                            <div className="flex items-start gap-2">
                              <div className={cn("p-1.5 rounded", config.color)}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{task.title}</div>
                                {task.subtitle && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {task.subtitle}
                                  </div>
                                )}
                                <Badge variant="outline" className="mt-2 text-xs">
                                  {config.label}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No tasks scheduled</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Click a day to view details</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4 justify-center">
            {Object.entries(taskTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <div className={cn("p-1 rounded border", config.color)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <span>{config.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
