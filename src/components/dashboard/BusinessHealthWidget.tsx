import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Heart, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessHealthWidgetProps {
  revenuePerMachineThisWeek: number;
  weekOverWeekChange: number;
  collectionStreak: number;
  overallGrowth: number;
  totalThisMonth: number;
  underperformers: Array<{ locationName: string; currentMonth: number }>;
  locationGrowth: Array<{ locationName: string; growthPercent: number; currentMonth: number }>;
}

export function BusinessHealthWidget({
  revenuePerMachineThisWeek,
  weekOverWeekChange,
  collectionStreak,
  overallGrowth,
  totalThisMonth,
  underperformers,
  locationGrowth,
}: BusinessHealthWidgetProps) {
  const GrowthIcon = overallGrowth > 0 ? TrendingUp : overallGrowth < 0 ? TrendingDown : Minus;
  const growthColor = overallGrowth > 0 ? "text-green-600" : overallGrowth < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Business Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Rev/Machine/Wk</p>
            <p className="text-lg font-bold">${revenuePerMachineThisWeek.toFixed(0)}</p>
            <div className={cn("flex items-center justify-center gap-1 text-xs", 
              weekOverWeekChange > 0 ? "text-green-600" : weekOverWeekChange < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {weekOverWeekChange > 0 ? <TrendingUp className="h-3 w-3" /> : weekOverWeekChange < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {Math.abs(weekOverWeekChange).toFixed(0)}%
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">MoM Growth</p>
            <p className={cn("text-lg font-bold", growthColor)}>
              {overallGrowth > 0 ? "+" : ""}{overallGrowth.toFixed(0)}%
            </p>
            <GrowthIcon className={cn("h-4 w-4 mx-auto", growthColor)} />
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Month Revenue</p>
            <p className="text-lg font-bold">${totalThisMonth.toLocaleString()}</p>
            <Zap className="h-4 w-4 mx-auto text-primary" />
          </div>
        </div>

        {/* Underperformers */}
        {underperformers.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Needs Attention</span>
            </div>
            <div className="space-y-1">
              {underperformers.slice(0, 3).map(u => (
                <div key={u.locationName} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate mr-2">{u.locationName}</span>
                  <span className="font-medium">${u.currentMonth.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top growers */}
        {locationGrowth.filter(lg => lg.growthPercent > 0).length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Top Growers</p>
            {locationGrowth.filter(lg => lg.growthPercent > 0).slice(0, 3).map(lg => (
              <div key={lg.locationName} className="flex items-center justify-between text-sm">
                <span className="truncate mr-2">{lg.locationName}</span>
                <Badge variant="secondary" className="text-green-600 text-xs">
                  +{lg.growthPercent.toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        )}

        {totalThisMonth === 0 && underperformers.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Start logging revenue to see performance insights
          </div>
        )}
      </CardContent>
    </Card>
  );
}
