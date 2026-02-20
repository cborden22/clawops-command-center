import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Play, Car, MapPin, Navigation, Gauge, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { MileageRoute, RouteStop } from "@/hooks/useRoutesDB";
import { Vehicle } from "@/hooks/useVehiclesDB";
import { TrackingMode } from "@/components/mileage/TrackingModeSelector";
import { useLocations } from "@/hooks/useLocationsDB";

interface CustomStop extends RouteStop {
  enabled: boolean;
  displayName: string;
}

interface RouteRunSetupProps {
  route: MileageRoute;
  vehicles: Vehicle[];
  onStart: (vehicleId: string, trackingMode: TrackingMode, odometerStart?: number, customStops?: RouteStop[]) => Promise<void>;
  onCancel: () => void;
  isStarting: boolean;
}

export function RouteRunSetup({ route, vehicles, onStart, onCancel, isStarting }: RouteRunSetupProps) {
  const [vehicleId, setVehicleId] = useState("");
  const [trackingMode, setTrackingMode] = useState<TrackingMode>("odometer");
  const [odometerStart, setOdometerStart] = useState("");
  const { locations } = useLocations();

  // Build mutable stop list with resolved names
  const [customStops, setCustomStops] = useState<CustomStop[]>(() =>
    route.stops.map((stop) => {
      const loc = locations.find((l) => l.id === stop.locationId);
      return {
        ...stop,
        enabled: true,
        displayName: loc?.name || stop.customLocationName || `Stop ${stop.stopOrder + 1}`,
      };
    })
  );

  // Re-resolve names when locations load
  useMemo(() => {
    if (locations.length > 0) {
      setCustomStops((prev) =>
        prev.map((s) => {
          const loc = locations.find((l) => l.id === s.locationId);
          return {
            ...s,
            displayName: loc?.name || s.customLocationName || `Stop ${s.stopOrder + 1}`,
          };
        })
      );
    }
  }, [locations]);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const enabledCount = customStops.filter((s) => s.enabled).length;

  const moveStop = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= customStops.length) return;
    setCustomStops((prev) => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  };

  const toggleStop = (index: number) => {
    setCustomStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleStart = async () => {
    if (!vehicleId) return;
    const odoStart = trackingMode === "odometer" ? parseFloat(odometerStart) || undefined : undefined;
    const activeStops: RouteStop[] = customStops
      .filter((s) => s.enabled)
      .map(({ enabled, displayName, ...stop }, idx) => ({ ...stop, stopOrder: idx, customLocationName: displayName }));
    await onStart(vehicleId, trackingMode, odoStart, activeStops);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Start Route Run
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Route Summary */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="font-semibold text-foreground">{route.name}</h3>
            {route.description && (
              <p className="text-sm text-muted-foreground">{route.description}</p>
            )}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {enabledCount} of {customStops.length} stops
              </span>
              <Badge variant="secondary" className="text-xs">
                {route.totalMiles.toFixed(1)} mi
              </Badge>
              {route.isRoundTrip && <Badge variant="outline" className="text-xs">Round Trip</Badge>}
            </div>
          </div>

          {/* Stop List with skip/reorder */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Stops
            </Label>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {customStops.map((stop, index) => (
                <div
                  key={stop.id}
                  className={`flex items-center gap-2 rounded-lg border p-3 transition-colors ${
                    stop.enabled
                      ? "border-border bg-background"
                      : "border-border/50 bg-muted/40 opacity-60"
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${!stop.enabled ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {stop.displayName}
                    </p>
                    {stop.milesFromPrevious > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {stop.milesFromPrevious.toFixed(1)} mi from previous
                      </p>
                    )}
                  </div>

                  {/* Move up/down */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => moveStop(index, "up")}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === customStops.length - 1}
                      onClick={() => moveStop(index, "down")}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Skip toggle */}
                  <Switch
                    checked={stop.enabled}
                    onCheckedChange={() => toggleStop(index)}
                    aria-label={`Include ${stop.displayName}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehicle
            </Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} {v.licensePlate ? `(${v.licensePlate})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tracking Mode */}
          <div className="space-y-2">
            <Label>Tracking Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={trackingMode === "odometer" ? "default" : "outline"}
                className="h-14 flex-col gap-1"
                onClick={() => setTrackingMode("odometer")}
              >
                <Gauge className="h-5 w-5" />
                <span className="text-xs">Odometer</span>
              </Button>
              <Button
                type="button"
                variant={trackingMode === "gps" ? "default" : "outline"}
                className="h-14 flex-col gap-1"
                onClick={() => setTrackingMode("gps")}
              >
                <Navigation className="h-5 w-5" />
                <span className="text-xs">GPS</span>
              </Button>
            </div>
          </div>

          {/* Odometer Start */}
          {trackingMode === "odometer" && (
            <div className="space-y-2">
              <Label>Starting Odometer</Label>
              <NumberInput
                placeholder={selectedVehicle?.lastRecordedOdometer?.toString() || "Enter reading"}
                value={odometerStart}
                onChange={(e) => setOdometerStart(e.target.value)}
                inputMode="numeric"
                className="text-lg h-12"
              />
              {selectedVehicle?.lastRecordedOdometer && (
                <p className="text-xs text-muted-foreground">
                  Last recorded: {selectedVehicle.lastRecordedOdometer.toLocaleString()} mi
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onCancel} className="flex-1 h-12">
              Cancel
            </Button>
            <Button
              onClick={handleStart}
              disabled={!vehicleId || enabledCount === 0 || (trackingMode === "odometer" && !odometerStart) || isStarting}
              className="flex-1 h-12 gap-2"
            >
              <Play className="h-4 w-4" />
              {isStarting ? "Starting..." : `Start Route (${enabledCount} stops)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
