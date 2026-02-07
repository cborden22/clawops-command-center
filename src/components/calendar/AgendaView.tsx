import { useMemo } from "react";
import { format, isSameDay, isToday, isTomorrow, addDays, startOfDay } from "date-fns";
import { Package, Car, Wrench, Users, CheckSquare, MapPin, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ScheduledTask, TaskType } from "@/hooks/useSmartScheduler";
import { CalendarTask } from "@/hooks/useCalendarTasks";

interface AgendaViewProps {
  scheduledTasks: ScheduledTask[];
  customTasks: CalendarTask[];
  onToggleCustomTask?: (taskId: string) => void;
  daysToShow?: number;
}

const taskTypeConfig: Record<TaskType | "custom", { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  restock: { icon: Package, color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30", label: "Restock" },
  route: { icon: Car, color: "bg-blue-500/20 text-blue-600 border-blue-500/30", label: "Route" },
  maintenance: { icon: Wrench, color: "bg-orange-500/20 text-orange-600 border-orange-500/30", label: "Maintenance" },
  followup: { icon: Users, color: "bg-amber-500/20 text-amber-600 border-amber-500/30", label: "Follow-up" },
  custom: { icon: CheckSquare, color: "bg-purple-500/20 text-purple-600 border-purple-500/30", label: "Task" },
};

interface AgendaItem {
  id: string;
  type: TaskType | "custom";
  title: string;
  subtitle?: string;
  date: Date;
  completed?: boolean;
  isCustomTask?: boolean;
}

export function AgendaView({ scheduledTasks, customTasks, onToggleCustomTask, daysToShow = 14 }: AgendaViewProps) {
  // Combine and sort all tasks
  const agendaItems = useMemo(() => {
    const items: AgendaItem[] = [];
    const today = startOfDay(new Date());
    const endDate = addDays(today, daysToShow);

    // Add scheduled tasks
    scheduledTasks.forEach((task) => {
      if (task.dueDate >= today && task.dueDate <= endDate) {
        items.push({
          id: task.id,
          type: task.type,
          title: task.title,
          subtitle: task.subtitle,
          date: task.dueDate,
        });
      }
    });

    // Add custom tasks
    customTasks.forEach((task) => {
      const taskDate = new Date(task.taskDate + "T00:00:00");
      if (taskDate >= today && taskDate <= endDate) {
        items.push({
          id: task.id,
          type: "custom",
          title: task.title,
          subtitle: task.description || undefined,
          date: taskDate,
          completed: task.completed,
          isCustomTask: true,
        });
      }
    });

    // Sort by date
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [scheduledTasks, customTasks, daysToShow]);

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: { date: Date; items: AgendaItem[] }[] = [];
    
    agendaItems.forEach((item) => {
      const existingGroup = groups.find((g) => isSameDay(g.date, item.date));
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        groups.push({ date: item.date, items: [item] });
      }
    });

    return groups;
  }, [agendaItems]);

  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d");
  };

  if (agendaItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No upcoming tasks in the next {daysToShow} days</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-6 pr-4">
        {groupedItems.map((group) => (
          <div key={group.date.toISOString()}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className={cn(
                "text-sm font-semibold",
                isToday(group.date) && "text-gold-500"
              )}>
                {getDateLabel(group.date)}
              </h3>
              {isToday(group.date) && (
                <Badge variant="outline" className="text-xs bg-gold-500/10 text-gold-500 border-gold-500/30">
                  Today
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {group.items.map((item) => {
                const config = taskTypeConfig[item.type];
                const Icon = config.icon;

                return (
                  <Card 
                    key={item.id} 
                    className={cn(
                      "border transition-all",
                      config.color,
                      item.completed && "opacity-50"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-1.5 rounded", config.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "font-medium text-sm",
                            item.completed && "line-through"
                          )}>
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                              {item.subtitle}
                            </div>
                          )}
                          <Badge variant="outline" className="mt-2 text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        {item.isCustomTask && onToggleCustomTask && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => onToggleCustomTask(item.id)}
                          >
                            <Check className={cn(
                              "h-4 w-4",
                              item.completed ? "text-green-500" : "text-muted-foreground"
                            )} />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
