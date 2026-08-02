import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AlertTriangle, CalendarClock, Wrench, Clock, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReminderItem, useReminders } from "@/hooks/useReminders";

interface NotificationListProps {
  onNavigate?: () => void;
  limit?: number;
}

const iconFor = (item: ReminderItem) => {
  if (item.sourceType === "lead_followup") return CalendarClock;
  if (item.sourceType === "lead_install") return AlertTriangle;
  return Wrench;
};

function dueLabel(item: ReminderItem) {
  if (item.daysUntil === null) return "No install date";
  if (item.daysUntil < 0) return `Overdue by ${Math.abs(item.daysUntil)}d`;
  if (item.daysUntil === 0) return "Due today";
  return `In ${item.daysUntil}d`;
}

export function NotificationList({ onNavigate, limit }: NotificationListProps) {
  const navigate = useNavigate();
  const { items, isLoaded, dismiss, snooze } = useReminders();

  const visible = limit ? items.slice(0, limit) : items;

  if (!isLoaded) {
    return <p className="p-4 text-sm text-muted-foreground">Loading reminders…</p>;
  }

  if (visible.length === 0) {
    return (
      <div className="p-6 text-center">
        <CheckCheck className="h-8 w-8 mx-auto mb-2 text-success" />
        <p className="text-sm font-medium">You're all caught up</p>
        <p className="text-xs text-muted-foreground">No follow-ups or installs need attention.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {visible.map((item) => {
        const Icon = iconFor(item);
        return (
          <li key={item.key} className="p-3 hover:bg-muted/40 transition-colors">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0",
                  item.bucket === "overdue" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={() => {
                  navigate(item.href);
                  onNavigate?.();
                }}
                className="flex-1 min-w-0 text-left"
              >
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      item.bucket === "overdue"
                        ? "border-destructive/40 text-destructive"
                        : item.bucket === "today"
                        ? "border-warning/40 text-warning"
                        : "text-muted-foreground"
                    )}
                  >
                    {dueLabel(item)}
                  </Badge>
                  {item.dueDate && (
                    <span className="text-[10px] text-muted-foreground">{format(item.dueDate, "MMM d")}</span>
                  )}
                </div>
              </button>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label="Snooze for 3 days"
                  title="Snooze 3 days"
                  onClick={() => snooze(item, 3)}
                >
                  <Clock className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label="Dismiss reminder"
                  title="Dismiss"
                  onClick={() => dismiss(item)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
