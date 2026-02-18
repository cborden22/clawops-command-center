import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Badge } from "@/components/ui/badge";
import { Play, Car, MapPin, Navigation, Gauge } from "lucide-react";
import { MileageRoute } from "@/hooks/useRoutesDB";
import { Vehicle } from "@/hooks/useVehiclesDB";
import { TrackingMode } from "@/components/mileage/TrackingModeSelector";

interface RouteRunSetupProps {
  route: MileageRoute;
  vehicles: Vehicle[];
  onStart: (vehicleId: string, trackingMode: TrackingMode, odometerStart?: number) => Promise<void>;
  onCancel: () => void;
  isStarting: boolean;
}

export function RouteRunSetup({ route, vehicles, onStart, onCancel, isStarting }: RouteRunSetupProps) {
  const [vehicleId, setVehicleId] = useState("");
  const [trackingMode, setTrackingMode] = useState<TrackingMode>("odometer");
  const [odometerStart, setOdometerStart] = useState("");

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  const handleStart = async () => {
    if (!vehicleId) return;
    const odoStart = trackingMode === "odometer" ? parseFloat(odometerStart) || undefined : undefined;
    await onStart(vehicleId, trackingMode, odoStart);
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
                {route.stops.length} stops
              </span>
              <Badge variant="secondary" className="text-xs">
                {route.totalMiles.toFixed(1)} mi
              </Badge>
              {route.isRoundTrip && <Badge variant="outline" className="text-xs">Round Trip</Badge>}
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
              disabled={!vehicleId || (trackingMode === "odometer" && !odometerStart) || isStarting}
              className="flex-1 h-12 gap-2"
            >
              <Play className="h-4 w-4" />
              {isStarting ? "Starting..." : "Start Route"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
