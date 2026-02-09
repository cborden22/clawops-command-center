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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, Car, Wrench, Users, MapPin, CheckSquare, Check, Pencil, Trash2, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocations } from "@/hooks/useLocationsDB";
import { useRoutes } from "@/hooks/useRoutesDB";
import { useLeadsDB } from "@/hooks/useLeadsDB";
import { useMaintenanceReports } from "@/hooks/useMaintenanceReports";
import { useSmartScheduler } from "@/hooks/useSmartScheduler";
import { useCalendarTasks, CalendarTask } from "@/hooks/useCalendarTasks";
import { CalendarFilters, TaskTypeFilter } from "@/components/calendar/CalendarFilters";
import { AddTaskDialog } from "@/components/calendar/AddTaskDialog";
import { EditTaskDialog } from "@/components/calendar/EditTaskDialog";
import { AgendaView } from "@/components/calendar/AgendaView";
import { cn } from "@/lib/utils";

type ExtendedTaskType = "restock" | "route" | "maintenance" | "followup" | "custom";
type ExtendedTaskStatus = "overdue" | "due_today" | "due_soon" | "upcoming" | "completed";

interface CalendarDisplayTask {
  id: string;
  type: ExtendedTaskType;
  title: string;
  subtitle?: string;
  dueDate: Date;
  status: ExtendedTaskStatus;
  priority: "high" | "medium" | "low";
  link: string;
  metadata: {
    locationId?: string;
    routeId?: string;
    scheduleType?: string;
    leadId?: string;
    isCustom?: boolean;
    completed?: boolean;
  };
}

const taskTypeConfig: Record<ExtendedTaskType, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  restock: { icon: Package, color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30", label: "Restock" },
  route: { icon: Car, color: "bg-blue-500/20 text-blue-600 border-blue-500/30", label: "Route" },
  maintenance: { icon: Wrench, color: "bg-orange-500/20 text-orange-600 border-orange-500/30", label: "Maintenance" },
  followup: { icon: Users, color: "bg-amber-500/20 text-amber-600 border-amber-500/30", label: "Follow-up" },
  custom: { icon: CheckSquare, color: "bg-purple-500/20 text-purple-600 border-purple-500/30", label: "Task" },
};

export default function Calendar() {
  const [viewMode, setViewMode] = useState<"month" | "week" | "agenda">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeFilters, setActiveFilters] = useState<TaskTypeFilter[]>([
    "restock", "route", "maintenance", "followup", "custom"
  ]);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch data from existing hooks
  const { locations } = useLocations();
  const { routes } = useRoutes();
  const { leads } = useLeadsDB();
  const { reports } = useMaintenanceReports();
  const { tasks: customTasks, toggleCompleted, createTask, updateTask, deleteTask } = useCalendarTasks();

  // Get scheduled tasks from smart scheduler
  const { restockStatuses, routeScheduleStatuses } = useSmartScheduler({
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

  // Generate all tasks for the current month view
  const monthlyTasks = useMemo(() => {
    const tasks: CalendarDisplayTask[] = [];
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    if (activeFilters.includes("restock")) {
      restockStatuses.forEach((status) => {
        if (status.status !== "no_schedule") {
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
    }

    if (activeFilters.includes("route")) {
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
          nextDate = addDays(nextDate, 7);
        }
      });
    }

    if (activeFilters.includes("maintenance")) {
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
    }

    if (activeFilters.includes("followup")) {
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
    }

    if (activeFilters.includes("custom")) {
      customTasks.forEach((ct) => {
        const taskDate = new Date(ct.taskDate + "T00:00:00");
        if (taskDate >= monthStart && taskDate <= monthEnd) {
          tasks.push({
            id: ct.id,
            type: "custom",
            title: ct.title,
            subtitle: ct.description || undefined,
            dueDate: taskDate,
            status: ct.completed ? "completed" : "upcoming",
            priority: "medium",
            link: "/calendar",
            metadata: { isCustom: true, completed: ct.completed },
          });
        }
      });
    }

    return tasks;
  }, [currentDate, restockStatuses, routeScheduleStatuses, reports, leads, customTasks, activeFilters]);

  // Group tasks by date for calendar display
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, CalendarDisplayTask[]>();
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
    if (viewMode === "month" || viewMode === "agenda") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === "month" || viewMode === "agenda") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleToggleFilter = (filter: TaskTypeFilter) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const getTasksForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return tasksByDate.get(dateKey) || [];
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const todayTasks = getTasksForDate(new Date());
  const weekTasks = weekDays.reduce((acc, day) => acc + getTasksForDate(day).length, 0);

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    await deleteTask(deletingTask.id);
    setIsDeleting(false);
    setDeletingTask(null);
  };

  const handleEditFromId = (taskId: string) => {
    const ct = customTasks.find(t => t.id === taskId);
    if (ct) setEditingTask(ct);
  };

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
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "week" | "agenda")}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            </TabsList>
          </Tabs>
          <AddTaskDialog defaultDate={selectedDate || new Date()} createTask={createTask} />
        </div>
      </div>

      {/* Task Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{todayTasks.length} task{todayTasks.length !== 1 ? "s" : ""} today</span>
        <span>•</span>
        <span>{weekTasks} this week</span>
      </div>

      {/* Filters */}
      <CalendarFilters activeFilters={activeFilters} onToggleFilter={handleToggleFilter} />

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">
          {viewMode === "week" 
            ? `Week of ${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d, yyyy")}`
            : format(currentDate, "MMMM yyyy")
          }
        </h2>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {viewMode === "agenda" ? (
        <Card>
          <CardContent className="p-6">
            <AgendaView 
              scheduledTasks={monthlyTasks}
              onToggleCustomTask={toggleCompleted}
              onEditTask={handleEditFromId}
              onDeleteTask={(id) => {
                const task = monthlyTasks.find(t => t.id === id);
                if (task) setDeletingTask({ id, title: task.title });
              }}
              daysToShow={30}
            />
          </CardContent>
        </Card>
      ) : (
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
                            "min-h-[90px] sm:min-h-[100px] p-1.5 text-left border rounded-lg transition-all hover:bg-accent/50",
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
                              const config = taskTypeConfig[task.type as ExtendedTaskType];
                              const isCompleted = task.metadata?.completed;
                              return (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "text-xs px-1 py-0.5 rounded truncate border",
                                    config.color,
                                    isCompleted && "opacity-50 line-through"
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
                                const config = taskTypeConfig[task.type as ExtendedTaskType];
                                const Icon = config.icon;
                                const isCompleted = task.metadata?.completed;
                                return (
                                  <div
                                    key={task.id}
                                    className={cn(
                                      "text-xs p-2 rounded border",
                                      config.color,
                                      isCompleted && "opacity-50"
                                    )}
                                  >
                                    <div className={cn(
                                      "flex items-center gap-1 font-medium",
                                      isCompleted && "line-through"
                                    )}>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-gold-500" />
                  {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select a day"}
                </CardTitle>
                {selectedDate && selectedDateTasks.length > 0 && (
                  <AddTaskDialog
                    defaultDate={selectedDate}
                    createTask={createTask}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    }
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {selectedDate ? (
                  selectedDateTasks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateTasks.map((task) => {
                        const config = taskTypeConfig[task.type as ExtendedTaskType];
                        const Icon = config.icon;
                        const isCustom = task.metadata?.isCustom;
                        const isCompleted = task.metadata?.completed;
                        
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "p-3 rounded-lg border transition-all hover:shadow-md group",
                              config.color,
                              isCompleted && "opacity-50"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <div className={cn("p-1.5 rounded shrink-0", config.color)}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  "font-medium text-sm",
                                  isCompleted && "line-through"
                                )}>
                                  {task.title}
                                </div>
                                {task.subtitle && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {task.subtitle}
                                  </div>
                                )}
                                <Badge variant="outline" className="mt-1.5 text-xs">
                                  {config.label}
                                </Badge>
                              </div>
                              {isCustom && (
                                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => toggleCompleted(task.id)}
                                  >
                                    <Check className={cn(
                                      "h-3.5 w-3.5",
                                      isCompleted ? "text-green-500" : "text-muted-foreground"
                                    )} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      const ct = customTasks.find(t => t.id === task.id);
                                      if (ct) setEditingTask(ct);
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive/70 hover:text-destructive"
                                    onClick={() => setDeletingTask({ id: task.id, title: task.title })}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm mb-3">No tasks scheduled</p>
                      <AddTaskDialog defaultDate={selectedDate} createTask={createTask} />
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
      )}

      {/* Root-level Delete AlertDialog */}
      <AlertDialog open={!!deletingTask} onOpenChange={(open) => { if (!open) setDeletingTask(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Task?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>"{deletingTask?.title}"</strong>?
              </p>
              <p className="text-destructive font-medium text-xs">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Task"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        onSave={async (id, updates) => {
          await updateTask(id, updates);
        }}
        onDelete={async (id) => {
          await deleteTask(id);
        }}
      />
    </div>
  );
}
