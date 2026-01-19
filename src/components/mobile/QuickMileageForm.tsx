import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMileage } from "@/hooks/useMileageDB";
import { useLocations } from "@/hooks/useLocationsDB";
import { useRoutes, MileageRoute } from "@/hooks/useRoutesDB";
import { toast } from "@/hooks/use-toast";
import { Loader2, RotateCcw, MapPin, Route, X } from "lucide-react";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface QuickMileageFormProps {
  onSuccess: () => void;
}

const tripPurposes = [
  "Collection Run",
  "Restocking",
  "Maintenance",
  "New Location Visit",
  "Supply Pickup",
  "Meeting",
  "Other",
];

export function QuickMileageForm({ onSuccess }: QuickMileageFormProps) {
  const { addEntry } = useMileage();
  const { locations, getLocationById } = useLocations();
  const { routes, getRouteById } = useRoutes();
  const { settings } = useAppSettings();
  
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [startLocation, setStartLocation] = useState(settings.warehouseAddress || "");
  const [endLocation, setEndLocation] = useState("");
  const [miles, setMiles] = useState("");
  const [purpose, setPurpose] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeLocations = locations.filter((loc) => loc.isActive);

  const handleRouteSelect = (routeId: string) => {
    if (!routeId || routeId === "none") {
      handleClearRoute();
      return;
    }

    const route = getRouteById(routeId);
    if (!route || route.stops.length < 2) return;

    const firstStop = route.stops[0];
    const lastStop = route.stops[route.stops.length - 1];

    // Get start location name
    let startName = "";
    if (firstStop.locationId) {
      const loc = getLocationById(firstStop.locationId);
      startName = loc?.name || "Unknown";
    } else {
      startName = firstStop.customLocationName || "Unknown";
    }

    // Get end location name
    let endName = "";
    if (lastStop.locationId) {
      const loc = getLocationById(lastStop.locationId);
      endName = loc?.name || "Unknown";
    } else {
      endName = lastStop.customLocationName || "Unknown";
    }

    // Calculate one-way miles
    const oneWayMiles = route.stops.reduce((sum, s) => sum + s.milesFromPrevious, 0);

    setSelectedRouteId(routeId);
    setStartLocation(startName);
    setEndLocation(endName);
    setMiles(oneWayMiles.toString());
    setIsRoundTrip(route.isRoundTrip);
    setPurpose(route.name);
  };

  const handleClearRoute = () => {
    setSelectedRouteId("");
    setStartLocation(settings.warehouseAddress || "");
    setEndLocation("");
    setMiles("");
    setPurpose("");
    setIsRoundTrip(true);
  };

  const handleLocationSelect = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId);
    if (location?.address) {
      setEndLocation(location.address);
    }
  };

  const handleSubmit = async () => {
    if (!startLocation.trim() || !endLocation.trim()) {
      toast({ title: "Enter locations", description: "Please enter start and end locations.", variant: "destructive" });
      return;
    }
    if (!miles || parseFloat(miles) <= 0) {
      toast({ title: "Enter miles", description: "Please enter a valid mileage.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate total miles (doubled if round trip)
      const totalMiles = isRoundTrip ? parseFloat(miles) * 2 : parseFloat(miles);
      
      await addEntry({
        date: new Date(),
        startLocation: startLocation.trim(),
        endLocation: endLocation.trim(),
        miles: totalMiles,
        purpose: purpose || "",
        isRoundTrip,
        notes: notes || "",
      });
      toast({ title: "Mileage logged!", description: `${totalMiles} miles recorded.` });
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to log mileage.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoute = selectedRouteId ? getRouteById(selectedRouteId) : undefined;

  return (
    <div className="space-y-4">
      {/* Route Quick Select */}
      {routes.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select a Saved Route</Label>
          <div className="flex gap-2">
            <Select value={selectedRouteId || "none"} onValueChange={handleRouteSelect}>
              <SelectTrigger className="flex-1 h-12">
                <SelectValue placeholder="Quick select a route..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No route (manual entry)</span>
                </SelectItem>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id}>
                    <div className="flex items-center gap-2">
                      <Route className="h-3 w-3" />
                      <span>{route.name}</span>
                      <span className="text-muted-foreground">({route.totalMiles.toFixed(1)} mi)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRouteId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearRoute}
                className="flex-shrink-0 h-12 w-12"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {selectedRoute && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Route: {selectedRoute.name}</p>
              <p className="text-sm">
                {selectedRoute.stops.length} stops • {selectedRoute.totalMiles.toFixed(1)} mi total
                {selectedRoute.isRoundTrip && " (round trip)"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Start Location */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Start Location</Label>
        <Input
          placeholder="e.g., Home, Warehouse"
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
          className="h-12"
        />
        {settings.warehouseAddress && startLocation !== settings.warehouseAddress && !selectedRouteId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setStartLocation(settings.warehouseAddress)}
          >
            <MapPin className="h-3 w-3 mr-1" />
            Use Warehouse
          </Button>
        )}
      </div>

      {/* End Location */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">End Location</Label>
        <Input
          placeholder="e.g., Store name, Address"
          value={endLocation}
          onChange={(e) => setEndLocation(e.target.value)}
          className="h-12"
        />
        {activeLocations.length > 0 && !selectedRouteId && (
          <Select onValueChange={handleLocationSelect}>
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder="Quick select from saved locations" />
            </SelectTrigger>
            <SelectContent>
              {activeLocations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id} disabled={!loc.address}>
                  {loc.name} {!loc.address && "(no address)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Miles */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Miles (one-way)</Label>
        <Input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={miles}
          onChange={(e) => setMiles(e.target.value)}
          className="h-14 text-2xl font-semibold text-center"
          onFocus={(e) => e.target.select()}
        />
      </div>

      {/* Round Trip Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Round Trip</Label>
        </div>
        <Switch checked={isRoundTrip} onCheckedChange={setIsRoundTrip} />
      </div>
      {isRoundTrip && miles && (
        <p className="text-xs text-muted-foreground text-center">
          Total: {(parseFloat(miles) * 2).toFixed(1)} miles
        </p>
      )}

      {/* Purpose */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Purpose</Label>
        <Select value={purpose} onValueChange={setPurpose}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select purpose" />
          </SelectTrigger>
          <SelectContent>
            {tripPurposes.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Notes (Optional)</Label>
        <Textarea
          placeholder="Add notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[60px] resize-none"
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !miles || !startLocation || !endLocation}
        className="w-full h-14 text-lg font-semibold"
        size="lg"
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Log Trip"}
      </Button>
    </div>
  );
}
