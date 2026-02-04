import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Route, Package, Wrench, ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { ScheduledTask, TaskType } from "@/hooks/useSmartScheduler";

interface WeeklyCalendarWidgetProps {
  tasksByDate: Map<string, ScheduledTask[]>;
}

const TASK_ICONS: Record<TaskType, React.ReactNode> = {
  restock: <MapPin className="h-3 w-3" />,
  route: <Route className="h-3 w-3" />,
  maintenance: <Wrench className="h-3 w-3" />,
  followup: <Users className="h-3 w-3" />,
};

const TASK_COLORS: Record<TaskType, string> = {
  restock: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  route: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  maintenance: "bg-red-500/10 text-red-600 border-red-500/20",
  followup: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  overdue: "ring-2 ring-destructive/50",
  due_today: "ring-2 ring-amber-500/50",
  due_soon: "",
  upcoming: "",
};

export function WeeklyCalendarWidget({ tasksByDate }: WeeklyCalendarWidgetProps) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const getDayLabel = (date: Date, index: number) => {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";
    return format(date, "EEE");
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          This Week
        </CardTitle>
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Restock</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Route</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Maint.</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Follow-up</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((date, index) => {
            const dateKey = date.toISOString().split("T")[0];
            const tasks = tasksByDate.get(dateKey) || [];
            const isToday = isSameDay(date, today);
            const hasUrgent = tasks.some((t) => t.status === "overdue" || t.status === "due_today");

            return (
              <div
                key={dateKey}
                className={cn(
                  "flex flex-col rounded-lg border transition-all min-h-[120px]",
                  isToday 
                    ? "border-primary bg-primary/5" 
                    : "border-border/50 bg-muted/20",
                  hasUrgent && !isToday && "border-amber-500/50 bg-amber-500/5"
                )}
              >
                {/* Day Header */}
                <div
                  className={cn(
                    "text-center py-1.5 rounded-t-lg border-b",
                    isToday 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-muted/50 border-border/50"
                  )}
                >
                  <p className="text-[10px] sm:text-xs font-medium">
                    {getDayLabel(date, index)}
                  </p>
                  <p className={cn(
                    "text-sm sm:text-base font-bold",
                    isToday ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {format(date, "d")}
                  </p>
                </div>

                {/* Tasks */}
                <div className="flex-1 p-1 space-y-1 overflow-y-auto max-h-[100px]">
                  {tasks.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-2">
                      —
                    </p>
                  ) : (
                    tasks.slice(0, 3).map((task) => (
                      <Link
                        key={task.id}
                        to={task.link}
                        className={cn(
                          "block p-1 rounded text-[10px] sm:text-xs border truncate transition-all hover:opacity-80",
                          TASK_COLORS[task.type],
                          STATUS_STYLES[task.status]
                        )}
                        title={task.title}
                      >
                        <div className="flex items-center gap-1">
                          {TASK_ICONS[task.type]}
                          <span className="truncate">{task.title}</span>
                        </div>
                      </Link>
                    ))
                  )}
                  {tasks.length > 3 && (
                    <p className="text-[10px] text-center text-muted-foreground">
                      +{tasks.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {Array.from(tasksByDate.values()).every((tasks) => tasks.length === 0) && (
          <div className="text-center py-4 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No scheduled tasks this week</p>
            <p className="text-xs mt-1">
              Set restock schedules on locations or route schedules to see them here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
