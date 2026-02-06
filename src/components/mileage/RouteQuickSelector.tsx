import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, MapPin, ChevronRight, X } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MileageRoute, RouteStop } from "@/hooks/useRoutesDB";

interface Location {
  id: string;
  name: string;
  address?: string | null;
}

interface RouteQuickSelectorProps {
  routes: MileageRoute[];
  selectedRouteId: string | null;
  onSelectRoute: (route: MileageRoute | null) => void;
  locations: Location[];
  warehouseAddress: string;
}

export function RouteQuickSelector({ 
  routes, 
  selectedRouteId, 
  onSelectRoute, 
  locations,
  warehouseAddress 
}: RouteQuickSelectorProps) {
  const selectedRoute = selectedRouteId ? routes.find(r => r.id === selectedRouteId) : null;
  
  // Get display name for a stop
  const getStopDisplayName = (stop: RouteStop): string => {
    if (stop.locationId) {
      const location = locations.find(l => l.id === stop.locationId);
      return location?.name || "Unknown Location";
    }
    
    if (stop.customLocationName) {
      // Shorten warehouse address for display
      if (stop.customLocationName === warehouseAddress || 
          stop.customLocationName.toLowerCase().includes("warehouse") ||
          stop.customLocationName.toLowerCase() === "starting point") {
        return "Warehouse";
      }
      // Truncate long custom names
      return stop.customLocationName.length > 20 
        ? stop.customLocationName.substring(0, 20) + "..." 
        : stop.customLocationName;
    }
    
    return "Unknown";
  };

  const handleValueChange = (value: string) => {
    if (value === "manual") {
      onSelectRoute(null);
    } else {
      const route = routes.find(r => r.id === value);
      if (route) {
        onSelectRoute(route);
      }
    }
  };

  const handleClear = () => {
    onSelectRoute(null);
  };

  if (routes.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card border-dashed border-2 border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Quick Start from Route</span>
          </div>
          {selectedRoute && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        
        <Select 
          value={selectedRouteId || "manual"} 
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="h-10 bg-background">
            <SelectValue placeholder="Select a saved route..." />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border z-[100]">
            <SelectItem value="manual">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Enter locations manually</span>
              </div>
            </SelectItem>
            {routes.map((route) => (
              <SelectItem key={route.id} value={route.id}>
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  <span>{route.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {route.totalMiles.toFixed(1)} mi
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Route Preview */}
        {selectedRoute && selectedRoute.stops.length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>Route stops:</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap text-sm">
              {selectedRoute.stops.map((stop, index) => (
                <div key={stop.id} className="flex items-center gap-1">
                  <span className="font-medium text-foreground">
                    {getStopDisplayName(stop)}
                  </span>
                  {index < selectedRoute.stops.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Est. {selectedRoute.totalMiles.toFixed(1)} miles</span>
              {selectedRoute.isRoundTrip && (
                <Badge variant="outline" className="text-[10px] px-1.5">Round Trip</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
