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
                trend === "up" && "bg-green-500/10 text-green-600",
                trend === "down" && "bg-red-500/10 text-red-600",
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
          <div className="mb-2">
            <p className="text-2xl font-bold tracking-tight">{metric}</p>
            {metricLabel && (
              <p className="text-xs text-muted-foreground">{metricLabel}</p>
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
            rank === 1 && "bg-yellow-500/20 text-yellow-600",
            rank === 2 && "bg-slate-400/20 text-slate-600",
            rank === 3 && "bg-amber-600/20 text-amber-700",
            rank > 3 && "bg-muted text-muted-foreground"
          )}>
            {rank}
          </span>
        )}
        {Icon && !rank && (
          <span className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            status === "success" && "bg-green-500/10 text-green-600",
            status === "warning" && "bg-yellow-500/10 text-yellow-600",
            status === "error" && "bg-red-500/10 text-red-600",
            status === "info" && "bg-blue-500/10 text-blue-600",
            !status && "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="text-sm font-medium truncate max-w-[150px]">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}
