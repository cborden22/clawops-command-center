import { MapPin, ArrowRight } from "lucide-react";
import { MileageRoute } from "@/hooks/useRoutesDB";
import { useLocations } from "@/hooks/useLocationsDB";

interface RoutePreviewProps {
  route: MileageRoute;
  compact?: boolean;
}

export function RoutePreview({ route, compact = false }: RoutePreviewProps) {
  const { getLocationById } = useLocations();

  const getStopName = (stop: { locationId?: string; customLocationName?: string }): string => {
    if (stop.locationId) {
      const location = getLocationById(stop.locationId);
      return location?.name || "Unknown Location";
    }
    return stop.customLocationName || "Unknown";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden">
        {route.stops.map((stop, index) => (
          <span key={stop.id} className="flex items-center gap-1 whitespace-nowrap">
            {index > 0 && <ArrowRight className="h-3 w-3 flex-shrink-0" />}
            <span className="truncate max-w-[80px]">{getStopName(stop)}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {route.stops.map((stop, index) => (
        <div key={stop.id} className="flex items-start gap-2">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              index === 0 ? "bg-green-500" : 
              index === route.stops.length - 1 ? "bg-red-500" : 
              "bg-primary"
            }`} />
            {index < route.stops.length - 1 && (
              <div className="w-0.5 h-6 bg-border" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{getStopName(stop)}</p>
            {stop.milesFromPrevious > 0 && (
              <p className="text-xs text-muted-foreground">
                {stop.milesFromPrevious.toFixed(1)} mi from previous
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
