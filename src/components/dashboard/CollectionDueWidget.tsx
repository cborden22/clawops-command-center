import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CollectionStatus } from "@/hooks/useSmartScheduler";

interface CollectionDueWidgetProps {
  overdueCollections: CollectionStatus[];
  dueTodayCollections: CollectionStatus[];
}

export function CollectionDueWidget({
  overdueCollections,
  dueTodayCollections,
}: CollectionDueWidgetProps) {
  const hasAlerts = overdueCollections.length > 0 || dueTodayCollections.length > 0;

  return (
    <Card className={cn(
      "glass-card",
      overdueCollections.length > 0 && "border-destructive/30",
      overdueCollections.length === 0 && dueTodayCollections.length > 0 && "border-amber-500/30"
    )}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          {hasAlerts ? (
            <AlertTriangle className={cn(
              "h-5 w-5",
              overdueCollections.length > 0 ? "text-destructive" : "text-amber-500"
            )} />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          Collection Reminders
          {hasAlerts && (
            <Badge 
              variant="destructive" 
              className={cn(
                "text-xs",
                overdueCollections.length === 0 && "bg-amber-500 hover:bg-amber-600"
              )}
            >
              {overdueCollections.length + dueTodayCollections.length}
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
            All collections are up to date
          </div>
        ) : (
          <>
            {/* Overdue Collections */}
            {overdueCollections.map((collection) => (
              <div
                key={collection.locationId}
                className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{collection.locationName}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {format(collection.nextDueDate, "MMM d")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-xs flex-shrink-0">
                    {collection.daysOverdue} days overdue
                  </Badge>
                </div>
                {collection.lastCollectionDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last collected: {format(collection.lastCollectionDate, "MMM d, yyyy")}
                  </div>
                )}
              </div>
            ))}

            {/* Due Today Collections */}
            {dueTodayCollections.map((collection) => (
              <div
                key={collection.locationId}
                className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{collection.locationName}</p>
                      <p className="text-xs text-muted-foreground">
                        Schedule: Every {collection.frequencyDays} days
                      </p>
                    </div>
                  </div>
                  <Badge className="text-xs flex-shrink-0 bg-amber-500 hover:bg-amber-600">
                    Due today
                  </Badge>
                </div>
                {collection.lastCollectionDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last collected: {format(collection.lastCollectionDate, "MMM d, yyyy")}
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
