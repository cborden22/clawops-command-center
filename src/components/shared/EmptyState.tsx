import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Primary call to action (e.g. a create button). */
  action?: ReactNode;
  /** When provided, renders a "Clear filters" action — use for filtered-but-empty lists. */
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
}

/** Consistent empty state: icon, one-line explanation, primary action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onClear,
  clearLabel = "Clear filters",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 gap-3",
        className
      )}
    >
      {Icon && (
        <span className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </span>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
        )}
      </div>
      {(action || onClear) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action}
          {onClear && (
            <Button variant="outline" size="sm" onClick={onClear}>
              {clearLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
