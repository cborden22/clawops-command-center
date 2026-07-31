import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ReportCardProps {
  title: string;
  icon?: LucideIcon;
  metric?: string | number;
  metricLabel?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ReportCard({
  title,
  icon: Icon,
  metric,
  metricLabel,
  trend,
  trendValue,
  children,
  className,
  onClick,
}: ReportCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/30",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {title}
          </CardTitle>
          {trend && trendValue && (
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                trend === "up" && "bg-success/10 text-success",
                trend === "down" && "bg-destructive/10 text-destructive",
                trend === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {trendValue}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {metric !== undefined && (
          <div className="mb-2 min-w-0">
            <p className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums truncate">{metric}</p>
            {metricLabel && (
              <p className="text-xs text-muted-foreground truncate">{metricLabel}</p>
            )}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

interface ReportListItemProps {
  rank?: number;
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  status?: "success" | "warning" | "error" | "info";
}

export function ReportListItem({
  rank,
  label,
  value,
  subValue,
  icon: Icon,
  status,
}: ReportListItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        {rank !== undefined && (
          <span className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
            rank === 1 && "bg-warning/20 text-warning",
            rank === 2 && "bg-muted text-muted-foreground",
            rank === 3 && "bg-brand-200 text-brand-800",
            rank > 3 && "bg-muted text-muted-foreground"
          )}>
            {rank}
          </span>
        )}
        {Icon && !rank && (
          <span className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            status === "success" && "bg-success/10 text-success",
            status === "warning" && "bg-warning/10 text-warning",
            status === "error" && "bg-destructive/10 text-destructive",
            status === "info" && "bg-info/10 text-info",
            !status && "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="text-sm font-medium truncate max-w-[150px]">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}
      <div className="text-right">
        <p className="text-sm font-semibold">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}
