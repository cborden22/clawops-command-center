import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Gauge, AlertTriangle, Plus } from "lucide-react";
import { useVehicles, Vehicle } from "@/hooks/useVehiclesDB";

interface OdometerModeInputsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  selectedVehicleId: string;
  onVehicleChange: (vehicleId: string) => void;
  odometerStart: string;
  onOdometerStartChange: (value: string) => void;
  odometerEnd: string;
  onOdometerEndChange: (value: string) => void;
  calculatedMiles: number | null;
  onAddVehicle?: () => void;
}

export function OdometerModeInputs({
  enabled,
  onEnabledChange,
  selectedVehicleId,
  onVehicleChange,
  odometerStart,
  onOdometerStartChange,
  odometerEnd,
  onOdometerEndChange,
  calculatedMiles,
  onAddVehicle,
}: OdometerModeInputsProps) {
  const { vehicles, isLoaded, getVehicleById } = useVehicles();
  
  const selectedVehicle = selectedVehicleId ? getVehicleById(selectedVehicleId) : undefined;
  
  // Validation
  const startNum = parseFloat(odometerStart) || 0;
  const endNum = parseFloat(odometerEnd) || 0;
  const isEndLessThanStart = odometerEnd && odometerStart && endNum < startNum;
  const isLargeJump = calculatedMiles !== null && calculatedMiles > 500;

  return (
    <div className="space-y-4">
      {/* Odometer Mode Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium cursor-pointer">Use Odometer</Label>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      {enabled && (
        <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          {/* Vehicle Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Vehicle</Label>
            {!isLoaded ? (
              <div className="h-10 bg-muted/30 animate-pulse rounded-md" />
            ) : vehicles.length === 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">No vehicles added yet</p>
                {onAddVehicle && (
                  <Button variant="outline" size="sm" onClick={onAddVehicle} className="gap-2 w-fit">
                    <Plus className="h-4 w-4" />
                    Add Vehicle in Settings
                  </Button>
                )}
              </div>
            ) : (
              <Select value={selectedVehicleId} onValueChange={onVehicleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex items-center gap-2">
                        <Car className="h-3 w-3" />
                        <span>{vehicle.name}</span>
                        {vehicle.year && vehicle.make && (
                          <span className="text-muted-foreground text-xs">
                            ({vehicle.year} {vehicle.make})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedVehicle?.lastRecordedOdometer !== undefined && (
              <p className="text-xs text-muted-foreground">
                Last recorded: {selectedVehicle.lastRecordedOdometer.toLocaleString()} miles
              </p>
            )}
          </div>

          {/* Odometer Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Odometer</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="e.g., 45276"
                value={odometerStart}
                onChange={(e) => onOdometerStartChange(e.target.value)}
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Odometer</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="e.g., 45322"
                value={odometerEnd}
                onChange={(e) => onOdometerEndChange(e.target.value)}
                className="text-lg"
              />
            </div>
          </div>

          {/* Calculated Miles Display */}
          {calculatedMiles !== null && calculatedMiles > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
              <span className="text-sm font-medium">Calculated Miles</span>
              <Badge variant="secondary" className="text-lg font-bold">
                {calculatedMiles.toFixed(1)} mi
              </Badge>
            </div>
          )}

          {/* Validation Warnings */}
          {isEndLessThanStart && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>End odometer must be greater than start</span>
            </div>
          )}
          
          {isLargeJump && !isEndLessThanStart && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Large distance ({calculatedMiles?.toFixed(0)}+ miles) - verify readings</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for calculating miles from odometer readings
export function useOdometerCalculation(
  enabled: boolean,
  odometerStart: string,
  odometerEnd: string
): number | null {
  const [calculatedMiles, setCalculatedMiles] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCalculatedMiles(null);
      return;
    }

    const start = parseFloat(odometerStart);
    const end = parseFloat(odometerEnd);

    if (!isNaN(start) && !isNaN(end) && end > start) {
      setCalculatedMiles(end - start);
    } else {
      setCalculatedMiles(null);
    }
  }, [enabled, odometerStart, odometerEnd]);

  return calculatedMiles;
}
