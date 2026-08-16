import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Play,
  Navigation,
  MapPin,
  Package,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Route as RouteIcon,
  Warehouse,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useRoutes } from "@/hooks/useRoutesDB";
import { useRouteRun } from "@/hooks/useRouteRun";
import { useLocations } from "@/hooks/useLocationsDB";
import { useInventory } from "@/hooks/useInventoryDB";
import { useUserSchedules } from "@/hooks/useUserSchedules";
import { useSmartScheduler } from "@/hooks/useSmartScheduler";
import { haversineMeters, formatDistance } from "@/lib/geo";
import { cn } from "@/lib/utils";

function useCurrentPosition() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return coords;
}

const Today = () => {
  const navigate = useNavigate();
  const { routes, isLoaded: routesLoaded } = useRoutes();
  const { activeRun, isLoading: runLoading } = useRouteRun();
  const { locations, isLoaded: locationsLoaded } = useLocations();
  const { items, isLoaded: inventoryLoaded } = useInventory();
  const { schedules } = useUserSchedules();
  const coords = useCurrentPosition();

  const { routeScheduleStatuses, overdueRestocks, dueTodayRestocks } = useSmartScheduler({
    locations,
    routes,
    userSchedules: schedules,
  });

  const activeRoute = useMemo(
    () => (activeRun ? routes.find((r) => r.id === activeRun.routeId) : undefined),
    [activeRun, routes]
  );

  const suggestedRoute = useMemo(() => {
    const due = routeScheduleStatuses
      .filter((s) => s.status === "overdue" || s.status === "due_today")
      .sort((a, b) => a.nextScheduledDate.getTime() - b.nextScheduledDate.getTime())[0];
    if (due) return routes.find((r) => r.id === due.routeId);
    return undefined;
  }, [routeScheduleStatuses, routes]);

  const plannedRoute = activeRoute || suggestedRoute;

  const stopsWithLocations = useMemo(() => {
    if (!plannedRoute) return [];
    return plannedRoute.stops.map((stop) => ({
      stop,
      location: stop.locationId ? locations.find((l) => l.id === stop.locationId) : undefined,
    }));
  }, [plannedRoute, locations]);

  const nextStop = useMemo(() => {
    if (!plannedRoute) return undefined;
    const index = activeRun ? activeRun.currentStopIndex : 0;
    return stopsWithLocations[index];
  }, [plannedRoute, activeRun, stopsWithLocations]);

  const distanceToNext = useMemo(() => {
    if (!coords || !nextStop?.location?.latitude || !nextStop.location.longitude) return null;
    return haversineMeters(
      coords.lat,
      coords.lng,
      Number(nextStop.location.latitude),
      Number(nextStop.location.longitude)
    );
  }, [coords, nextStop]);

  // Cash expected today = unpaid commissions across the route's locations
  const cashExpected = useMemo(() => {
    const routeLocationIds = new Set(
      stopsWithLocations.map((s) => s.location?.id).filter(Boolean) as string[]
    );
    let total = 0;
    locations.forEach((loc) => {
      if (!routeLocationIds.has(loc.id)) return;
      (loc.commissionSummaries || []).forEach((summary: any) => {
        if (!summary.commissionPaid && !summary.commission_paid) {
          total += Number(summary.commissionAmount ?? summary.commission_amount ?? 0);
        }
      });
    });
    return total;
  }, [locations, stopsWithLocations]);

  const bringList = useMemo(
    () => items.filter((i) => i.minStock > 0 && i.quantity <= i.minStock).slice(0, 8),
    [items]
  );

  const isLoading = !routesLoaded || !locationsLoaded || runLoading;

  const startRoute = () => {
    if (!plannedRoute) return;
    navigate(`/mileage?runRoute=${plannedRoute.id}`);
  };

  const openMaps = () => {
    const address = nextStop?.location?.address;
    if (!address) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Today</h1>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : !plannedRoute ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={RouteIcon}
              title="No route scheduled for today"
              description="Build a route or start one manually to get a guided run with collections, photos, and mileage."
              actionLabel="Go to Routes"
              onAction={() => navigate("/mileage")}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/30 overflow-hidden">
          <div className="bg-primary/10 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary">
                {activeRun ? "Run in progress" : "Suggested for today"}
              </p>
              <p className="font-semibold truncate">{plannedRoute.name}</p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {activeRun
                ? `Stop ${Math.min(activeRun.currentStopIndex + 1, plannedRoute.stops.length)} of ${plannedRoute.stops.length}`
                : `${plannedRoute.stops.length} stops`}
            </Badge>
          </div>

          <CardContent className="pt-4 space-y-4">
            {nextStop && (
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Next stop
                </p>
                <p className="text-lg font-semibold truncate">
                  {nextStop.location?.name || nextStop.stop.customLocationName || "Stop"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {nextStop.location?.address && (
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{nextStop.location.address}</span>
                    </span>
                  )}
                  {distanceToNext !== null && (
                    <span className="flex items-center gap-1">
                      <Navigation className="h-3.5 w-3.5" />
                      {formatDistance(distanceToNext)}
                    </span>
                  )}
                  {nextStop.location?.machineCount ? (
                    <span>{nextStop.location.machineCount} machines</span>
                  ) : null}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Planned miles</p>
                <p className="text-lg font-semibold tabular-nums">
                  {plannedRoute.totalMiles.toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Commission due</p>
                <p className="text-lg font-semibold tabular-nums">${cashExpected.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground">Restocks due</p>
                <p className="text-lg font-semibold tabular-nums">
                  {overdueRestocks.length + dueTodayRestocks.length}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="lg" className="flex-1 h-12 text-base" onClick={startRoute}>
                <Play className="h-5 w-5 mr-2" />
                {activeRun ? "Resume run" : "Start route"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12"
                onClick={openMaps}
                disabled={!nextStop?.location?.address}
              >
                <Navigation className="h-5 w-5 mr-2" />
                Navigate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-primary" />
              Bring list
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!inventoryLoaded ? (
              <Skeleton className="h-24 w-full" />
            ) : bringList.length === 0 ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Everything is above its minimum stock level.
              </p>
            ) : (
              <ul className="space-y-2">
                {bringList.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span
                      className={cn(
                        "tabular-nums shrink-0",
                        item.quantity === 0 ? "text-destructive font-semibold" : "text-muted-foreground"
                      )}
                    >
                      {item.quantity} / {item.minStock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 px-0 text-primary"
              onClick={() => navigate("/inventory")}
            >
              Open inventory <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Needs attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueRestocks.length === 0 && dueTodayRestocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing is overdue right now.</p>
            ) : (
              [...overdueRestocks, ...dueTodayRestocks].slice(0, 6).map((r) => (
                <button
                  key={r.locationId}
                  onClick={() => navigate("/locations")}
                  className="w-full flex items-center justify-between gap-3 text-sm rounded-md px-2 py-2 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="truncate">{r.locationName}</span>
                  <Badge variant={r.status === "overdue" ? "destructive" : "secondary"}>
                    {r.status === "overdue" ? `${r.daysOverdue}d overdue` : "Due today"}
                  </Badge>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Stops on this route
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stopsWithLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stops planned.</p>
          ) : (
            <ol className="space-y-2">
              {stopsWithLocations.map(({ stop, location }, index) => {
                const done = activeRun ? index < activeRun.currentStopIndex : false;
                return (
                  <li
                    key={stop.id}
                    className={cn(
                      "flex items-center gap-3 rounded-md border border-border/60 px-3 py-2",
                      done && "opacity-60"
                    )}
                  >
                    <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                      {done ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : index + 1}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-sm">
                      {location?.name || stop.customLocationName || "Stop"}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {stop.milesFromPrevious.toFixed(1)} mi
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Today;
