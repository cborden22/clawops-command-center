import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, X, LocateFixed } from "lucide-react";
import { formatDistance } from "@/lib/geo";
import type { GeoStatus, NearestLocation } from "@/hooks/useGeofence";

interface ArrivalBannerProps {
  status: GeoStatus;
  error: string | null;
  nearest: NearestLocation | null;
  onRequestLocation: () => void;
  /** Action offered when the user is inside a location's geofence. */
  actionLabel?: string;
  onAction?: (nearest: NearestLocation) => void;
}

/**
 * Suggests — never forces — the location the user has arrived at.
 * GPS here is used purely for arrival detection, not mileage.
 */
export function ArrivalBanner({
  status,
  error,
  nearest,
  onRequestLocation,
  actionLabel,
  onAction,
}: ArrivalBannerProps) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  if (status === "unsupported") return null;

  if (status === "idle" || status === "denied" || status === "error") {
    return (
      <Card className="glass-card border-border/60">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <LocateFixed className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Arrival detection off</p>
            <p className="text-xs text-muted-foreground truncate">
              {error || "Turn on location to auto-detect the stop you're at."}
            </p>
          </div>
          {status !== "denied" && (
            <Button size="sm" variant="outline" onClick={onRequestLocation} className="shrink-0">
              Enable
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!nearest || !nearest.inside || dismissedId === nearest.location.id) {
    if (status === "locating") {
      return (
        <Card className="glass-card border-border/60">
          <CardContent className="p-3 flex items-center gap-3">
            <Navigation className="h-4 w-4 text-primary animate-pulse" />
            <p className="text-sm text-muted-foreground">Finding your location...</p>
          </CardContent>
        </Card>
      );
    }
    if (nearest) {
      return (
        <Card className="glass-card border-border/60">
          <CardContent className="p-3 flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground truncate">
              Nearest: <span className="text-foreground">{nearest.location.name}</span> ·{" "}
              {formatDistance(nearest.distanceMeters)}
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return (
    <Card className="glass-card border-primary/40 bg-primary/5 animate-fade-in">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                Arrived
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistance(nearest.distanceMeters)}
              </span>
            </div>
            <p className="font-semibold text-foreground truncate mt-1">
              {nearest.location.name}
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss arrival suggestion"
            onClick={() => setDismissedId(nearest.location.id)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {actionLabel && onAction && (
          <Button className="w-full h-11 gap-2" onClick={() => onAction(nearest)}>
            <Navigation className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
