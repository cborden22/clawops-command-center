import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  /** Semantic tone for the icon chip and trend text. */
  tone?: "default" | "success" | "warning" | "destructive" | "info";
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
}

const toneChip: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

const trendTone: Record<NonNullable<StatCardProps["trend"]>, string> = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

/**
 * The single stat tile used across Dashboard, Reports and page headers.
 * Keeps numbers from bunching on narrow viewports.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  trend,
  trendValue,
  className,
  onClick,
  children,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "transition-shadow",
        onClick && "cursor-pointer hover:shadow-hover",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
          {Icon && (
            <span
              className={cn(
                "shrink-0 h-7 w-7 rounded-md flex items-center justify-center",
                toneChip[tone]
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>
        <p className="mt-2 text-xl sm:text-2xl lg:text-[1.75rem] font-bold tracking-tight tabular-nums truncate">
          {value}
        </p>
        {(hint || trendValue) && (
          <p className="mt-0.5 text-xs truncate">
            {trendValue && (
              <span className={cn("font-medium", trend && trendTone[trend])}>{trendValue} </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
