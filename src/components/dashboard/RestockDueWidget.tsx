import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RestockStatus } from "@/hooks/useSmartScheduler";

interface RestockDueWidgetProps {
  overdueRestocks: RestockStatus[];
  dueTodayRestocks: RestockStatus[];
}

export function RestockDueWidget({
  overdueRestocks,
  dueTodayRestocks,
}: RestockDueWidgetProps) {
  const hasAlerts = overdueRestocks.length > 0 || dueTodayRestocks.length > 0;

  return (
    <Card className={cn(
      "glass-card",
      overdueRestocks.length > 0 && "border-destructive/30",
      overdueRestocks.length === 0 && dueTodayRestocks.length > 0 && "border-amber-500/30"
    )}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          {hasAlerts ? (
            <AlertTriangle className={cn(
              "h-5 w-5",
              overdueRestocks.length > 0 ? "text-destructive" : "text-amber-500"
            )} />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          Restock Reminders
          {hasAlerts && (
            <Badge 
              variant="destructive" 
              className={cn(
                "text-xs",
                overdueRestocks.length === 0 && "bg-amber-500 hover:bg-amber-600"
              )}
            >
              {overdueRestocks.length + dueTodayRestocks.length}
            </Badge>
          )}
        </CardTitle>
        <Link to="/locations">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            View all <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasAlerts ? (
          <div className="text-center py-6 text-green-600 text-sm font-medium">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            All restocks are up to date
          </div>
        ) : (
          <>
            {/* Overdue Restocks */}
            {overdueRestocks.map((restock) => (
              <div
                key={restock.locationId}
                className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{restock.locationName}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {format(restock.nextDueDate, "MMM d")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-xs flex-shrink-0">
                    {restock.daysOverdue} days overdue
                  </Badge>
                </div>
                {restock.lastRestockDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last restocked: {format(restock.lastRestockDate, "MMM d, yyyy")}
                  </div>
                )}
              </div>
            ))}

            {/* Due Today Restocks */}
            {dueTodayRestocks.map((restock) => (
              <div
                key={restock.locationId}
                className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{restock.locationName}</p>
                      <p className="text-xs text-muted-foreground">
                        Schedule: Every {restock.frequencyDays} days
                      </p>
                    </div>
                  </div>
                  <Badge className="text-xs flex-shrink-0 bg-amber-500 hover:bg-amber-600">
                    Due today
                  </Badge>
                </div>
                {restock.lastRestockDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last restocked: {format(restock.lastRestockDate, "MMM d, yyyy")}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
