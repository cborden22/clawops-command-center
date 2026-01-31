import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMileage } from "@/hooks/useMileageDB";
import { useLocations } from "@/hooks/useLocationsDB";
import { useVehicles } from "@/hooks/useVehiclesDB";
import { toast } from "@/hooks/use-toast";
import { Loader2, Car, AlertTriangle } from "lucide-react";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { LocationSelector, LocationSelection, getLocationDisplayString } from "@/components/mileage/LocationSelector";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const { addEntry } = useMileage();
  const { activeLocations } = useLocations();
  const { vehicles, updateVehicleOdometer, getVehicleById } = useVehicles();
  const { settings } = useAppSettings();
  
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [fromSelection, setFromSelection] = useState<LocationSelection>({ type: "warehouse" });
  const [toSelection, setToSelection] = useState<LocationSelection>({ type: "location" });
  const [odometerStart, setOdometerStart] = useState("");
  const [odometerEnd, setOdometerEnd] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate miles from odometer readings
  const startNum = parseFloat(odometerStart) || 0;
  const endNum = parseFloat(odometerEnd) || 0;
  const calculatedMiles = startNum && endNum && endNum > startNum ? endNum - startNum : null;
  const isEndLessThanStart = odometerEnd && odometerStart && endNum <= startNum;
  const isLargeJump = calculatedMiles !== null && calculatedMiles > 500;
  
  const selectedVehicle = selectedVehicleId ? getVehicleById(selectedVehicleId) : undefined;
  
  // Build warehouse address from settings
  const warehouseAddress = [
    settings.warehouseAddress,
    settings.warehouseCity,
    settings.warehouseState,
    settings.warehouseZip
  ].filter(Boolean).join(", ");

  const handleNavigateToSettings = () => {
    navigate("/settings");
    onSuccess(); // Close the sheet
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedVehicleId) {
      toast({ title: "Vehicle Required", description: "Please select a vehicle.", variant: "destructive" });
      return;
    }
    
    const startLocationStr = getLocationDisplayString(fromSelection, activeLocations, warehouseAddress);
    const endLocationStr = getLocationDisplayString(toSelection, activeLocations, warehouseAddress);
    
    if (!startLocationStr) {
      toast({ title: "From Required", description: "Please select or enter a start location.", variant: "destructive" });
      return;
    }
    
    if (!endLocationStr) {
      toast({ title: "To Required", description: "Please select or enter a destination.", variant: "destructive" });
      return;
    }
    
    if (!odometerStart || !odometerEnd) {
      toast({ title: "Odometer Required", description: "Enter both odometer readings.", variant: "destructive" });
      return;
    }
    
    const startVal = parseFloat(odometerStart);
    const endVal = parseFloat(odometerEnd);
    
    if (isNaN(startVal) || isNaN(endVal) || endVal <= startVal) {
      toast({ title: "Invalid Range", description: "End must be greater than start.", variant: "destructive" });
      return;
    }
    
    const milesToLog = endVal - startVal;
    const locationId = toSelection.type === "location" ? toSelection.locationId : undefined;

    setIsSubmitting(true);
    try {
      const result = await addEntry({
        date: new Date(),
        startLocation: startLocationStr,
        endLocation: endLocationStr,
        locationId,
        miles: milesToLog,
        purpose: purpose || "",
        isRoundTrip: false,
        notes: notes || "",
        vehicleId: selectedVehicleId,
        odometerStart: startVal,
        odometerEnd: endVal,
      });
      
      // Update vehicle's last recorded odometer
      if (result && selectedVehicleId) {
        await updateVehicleOdometer(selectedVehicleId, endVal);
      }
      
      toast({ 
        title: "Trip logged!", 
        description: `${milesToLog.toFixed(1)} miles recorded.` 
      });
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to log trip.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedVehicleId && odometerStart && odometerEnd && !isEndLessThanStart;

  return (
    <div className="space-y-4">
      {/* Vehicle Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Vehicle *</Label>
        {vehicles.length === 0 ? (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              No vehicles added.{" "}
              <Button variant="link" className="p-0 h-auto text-amber-600 dark:text-amber-400 underline" onClick={handleNavigateToSettings}>
                Add one in Settings
              </Button>
            </p>
          </div>
        ) : (
          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select a vehicle..." />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>{vehicle.name}</span>
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

      {/* From Location */}
      <LocationSelector
        type="from"
        value={fromSelection}
        onChange={setFromSelection}
        locations={activeLocations}
        warehouseAddress={warehouseAddress}
      />

      {/* To Location */}
      <LocationSelector
        type="to"
        value={toSelection}
        onChange={setToSelection}
        locations={activeLocations}
        warehouseAddress={warehouseAddress}
      />

      {/* Odometer Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Start Odometer *</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="e.g., 45276"
            value={odometerStart}
            onChange={(e) => setOdometerStart(e.target.value)}
            className="h-14 text-xl font-semibold text-center"
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">End Odometer *</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="e.g., 45322"
            value={odometerEnd}
            onChange={(e) => setOdometerEnd(e.target.value)}
            className="h-14 text-xl font-semibold text-center"
            onFocus={(e) => e.target.select()}
          />
        </div>
      </div>

      {/* Calculated Miles Display */}
      {calculatedMiles !== null && calculatedMiles > 0 && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium">Calculated Miles</span>
          <Badge className="text-lg font-bold px-4 py-1">
            {calculatedMiles.toFixed(1)} mi
          </Badge>
        </div>
      )}

      {/* Validation Warnings */}
      {isEndLessThanStart && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>End must be greater than start</span>
        </div>
      )}
      
      {isLargeJump && !isEndLessThanStart && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Large distance - verify readings</span>
        </div>
      )}

      {/* Purpose */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Purpose</Label>
        <Select value={purpose} onValueChange={setPurpose}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select purpose" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border z-50">
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
        disabled={isSubmitting || !isFormValid}
        className="w-full h-14 text-lg font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Logging...
          </>
        ) : (
          "Log Trip"
        )}
      </Button>
    </div>
  );
}
