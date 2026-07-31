import { Package, Car, Wrench, Users, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TaskTypeFilter = "restock" | "route" | "maintenance" | "followup" | "custom";

interface CalendarFiltersProps {
  activeFilters: TaskTypeFilter[];
  onToggleFilter: (filter: TaskTypeFilter) => void;
}

const filterConfig: { type: TaskTypeFilter; icon: React.ComponentType<{ className?: string }>; label: string; color: string }[] = [
  { type: "restock", icon: Package, label: "Restocks", color: "bg-success/20 text-success border-success/30 hover:bg-success/30" },
  { type: "route", icon: Car, label: "Routes", color: "bg-info/20 text-info border-info/30 hover:bg-info/30" },
  { type: "maintenance", icon: Wrench, label: "Maintenance", color: "bg-warning/20 text-warning border-warning/30 hover:bg-warning/30" },
  { type: "followup", icon: Users, label: "Follow-ups", color: "bg-warning/20 text-warning border-warning/30 hover:bg-warning/30" },
  { type: "custom", icon: CheckSquare, label: "Tasks", color: "bg-info/20 text-info border-info/30 hover:bg-info/30" },
];

export function CalendarFilters({ activeFilters, onToggleFilter }: CalendarFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filterConfig.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilters.includes(filter.type);
        
        return (
          <Button
            key={filter.type}
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 border transition-all",
              isActive ? filter.color : "opacity-50 hover:opacity-100"
            )}
            onClick={() => onToggleFilter(filter.type)}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="text-xs">{filter.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
