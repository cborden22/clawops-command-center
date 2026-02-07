import { Package, Car, Wrench, Users, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TaskTypeFilter = "restock" | "route" | "maintenance" | "followup" | "custom";

interface CalendarFiltersProps {
  activeFilters: TaskTypeFilter[];
  onToggleFilter: (filter: TaskTypeFilter) => void;
}

const filterConfig: { type: TaskTypeFilter; icon: React.ComponentType<{ className?: string }>; label: string; color: string }[] = [
  { type: "restock", icon: Package, label: "Restocks", color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/30" },
  { type: "route", icon: Car, label: "Routes", color: "bg-blue-500/20 text-blue-600 border-blue-500/30 hover:bg-blue-500/30" },
  { type: "maintenance", icon: Wrench, label: "Maintenance", color: "bg-orange-500/20 text-orange-600 border-orange-500/30 hover:bg-orange-500/30" },
  { type: "followup", icon: Users, label: "Follow-ups", color: "bg-amber-500/20 text-amber-600 border-amber-500/30 hover:bg-amber-500/30" },
  { type: "custom", icon: CheckSquare, label: "Tasks", color: "bg-purple-500/20 text-purple-600 border-purple-500/30 hover:bg-purple-500/30" },
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
