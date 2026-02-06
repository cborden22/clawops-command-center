import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLocations } from "@/hooks/useLocationsDB";
import { useVehicles } from "@/hooks/useVehiclesDB";
import { useActiveTrip } from "@/hooks/useActiveTrip";
import { useMileage, IRS_MILEAGE_RATE } from "@/hooks/useMileageDB";
import { useRoutes, MileageRoute, RouteStop } from "@/hooks/useRoutesDB";
import { toast } from "@/hooks/use-toast";
import { Loader2, Car, AlertTriangle, Play, CheckCircle, Trash2, MapPin, Clock, Navigation } from "lucide-react";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { LocationSelector, LocationSelection, getLocationDisplayString } from "@/components/mileage/LocationSelector";
import { TrackingModeSelector, TrackingMode } from "@/components/mileage/TrackingModeSelector";
import { GpsTracker } from "@/components/mileage/GpsTracker";
import { RouteQuickSelector } from "@/components/mileage/RouteQuickSelector";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const { activeLocations } = useLocations();
  const { vehicles, updateVehicleOdometer, getVehicleById } = useVehicles();
  const { activeTrip, startTrip, completeTrip, discardTrip } = useActiveTrip();
  const { refetch: refetchMileage } = useMileage();
  const { routes } = useRoutes();
  const { settings } = useAppSettings();
  
  // Tracking mode state
  const [trackingMode, setTrackingMode] = useState<TrackingMode>("odometer");
  const [isGpsCompleting, setIsGpsCompleting] = useState(false);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [fromSelection, setFromSelection] = useState<LocationSelection>({ type: "warehouse" });
  const [toSelection, setToSelection] = useState<LocationSelection>({ type: "location" });
  const [odometerStart, setOdometerStart] = useState("");
  const [odometerEnd, setOdometerEnd] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Build warehouse address from settings
  const warehouseAddress = [
    settings.warehouseAddress,
    settings.warehouseCity,
    settings.warehouseState,
    settings.warehouseZip
  ].filter(Boolean).join(", ");
  
  // Helper to convert route stop to location selection
  const stopToLocationSelection = (stop: RouteStop): LocationSelection => {
    if (stop.locationId) {
      return { type: "location", locationId: stop.locationId };
    }
    
    const customName = stop.customLocationName || "";
    
    // Check if this stop represents the warehouse
    if (customName === warehouseAddress || 
        customName.toLowerCase().includes("warehouse") ||
        customName.toLowerCase() === "starting point") {
      return { type: "warehouse" };
    }
    
    return { type: "custom", customName };
  };
  
  // Route selection handler
  const handleRouteSelect = (route: MileageRoute | null) => {
    if (!route) {
      setSelectedRouteId(null);
      return;
    }
    
    setSelectedRouteId(route.id);
    
    // Auto-populate From and To from first and last stops
    const firstStop = route.stops[0];
    const lastStop = route.stops[route.stops.length - 1];
    
    if (firstStop) {
      setFromSelection(stopToLocationSelection(firstStop));
    }
    
    if (lastStop) {
      setToSelection(stopToLocationSelection(lastStop));
    }
    
    // Set purpose to route name
    setPurpose(route.name);
  };
  
  // Handlers to clear route when From/To manually changed
  const handleFromChange = (selection: LocationSelection) => {
    setFromSelection(selection);
    if (selectedRouteId) setSelectedRouteId(null);
  };
  
  const handleToChange = (selection: LocationSelection) => {
    setToSelection(selection);
    if (selectedRouteId) setSelectedRouteId(null);
  };

  const handleNavigateToSettings = () => {
    navigate("/settings");
    onSuccess(); // Close the sheet
  };

  // For active trip completion
  const activeTripVehicle = activeTrip ? getVehicleById(activeTrip.vehicleId) : undefined;
  const activeEndNum = parseFloat(odometerEnd) || 0;
  const activeCalculatedMiles = activeTrip && activeEndNum > activeTrip.odometerStart 
    ? activeEndNum - activeTrip.odometerStart 
    : 0;
  const activeEstimatedDeduction = activeCalculatedMiles * IRS_MILEAGE_RATE;
  const isActiveEndValid = activeTrip && activeEndNum > activeTrip.odometerStart;

  const resetForm = () => {
    setOdometerStart("");
    setOdometerEnd("");
    setPurpose("");
    setNotes("");
    setToSelection({ type: "location" });
    setSelectedRouteId(null);
  };

  const handleStartTrip = async () => {
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
    
    // If no route is selected, destination is required
    const selectedRoute = selectedRouteId ? routes.find(r => r.id === selectedRouteId) : null;
    if (!selectedRouteId && !endLocationStr) {
      toast({ title: "To Required", description: "Please select a route or enter a destination.", variant: "destructive" });
      return;
    }
    
    // If route is selected, use route name as destination if To is empty
    const finalEndLocation = endLocationStr || (selectedRoute ? `${selectedRoute.name} (Route)` : "");
    
    if (!odometerStart) {
      toast({ title: "Start Odometer Required", description: "Enter your current odometer reading.", variant: "destructive" });
      return;
    }
    
    const startVal = parseFloat(odometerStart);
    if (isNaN(startVal)) {
      toast({ title: "Invalid Reading", description: "Please enter a valid odometer number.", variant: "destructive" });
      return;
    }
    
    const locationId = toSelection.type === "location" ? toSelection.locationId : undefined;

    setIsSubmitting(true);
    try {
      const result = await startTrip({
        vehicleId: selectedVehicleId,
        startLocation: startLocationStr,
        endLocation: finalEndLocation,
        locationId,
        odometerStart: startVal,
        purpose: purpose || "Business Trip",
        notes: notes || "",
        trackingMode: "odometer",
        routeId: selectedRouteId || undefined,
      });
      
      if (result) {
        toast({ 
          title: "Trip Started!", 
          description: "Enter end odometer when you arrive." 
        });
        resetForm();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to start trip.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartGpsTracking = async () => {
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
    
    // If no route is selected, destination is required
    const selectedRoute = selectedRouteId ? routes.find(r => r.id === selectedRouteId) : null;
    if (!selectedRouteId && !endLocationStr) {
      toast({ title: "To Required", description: "Please select a route or enter a destination.", variant: "destructive" });
      return;
    }
    
    // If route is selected, use route name as destination if To is empty
    const finalEndLocation = endLocationStr || (selectedRoute ? `${selectedRoute.name} (Route)` : "");
    
    const locationId = toSelection.type === "location" ? toSelection.locationId : undefined;

    setIsSubmitting(true);
    try {
      const result = await startTrip({
        vehicleId: selectedVehicleId,
        startLocation: startLocationStr,
        endLocation: finalEndLocation,
        locationId,
        odometerStart: 0, // GPS mode doesn't use odometer
        purpose: purpose || "Business Trip",
        notes: notes || "",
        trackingMode: "gps",
        routeId: selectedRouteId || undefined,
      });
      
      if (result) {
        toast({ 
          title: "GPS Tracking Started!", 
          description: "Tracking your route..." 
        });
        resetForm();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to start GPS tracking.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGpsComplete = async (data: {
    distanceMiles: number;
    gpsDistanceMeters: number;
    startLat?: number;
    startLng?: number;
    endLat?: number;
    endLng?: number;
    elapsedSeconds: number;
  }) => {
    setIsGpsCompleting(true);
    try {
      const success = await completeTrip({
        gpsDistanceMeters: data.gpsDistanceMeters,
        gpsEndLat: data.endLat,
        gpsEndLng: data.endLng,
      });
      
      if (success) {
        refetchMileage();
        onSuccess();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete trip.", variant: "destructive" });
    } finally {
      setIsGpsCompleting(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!activeTrip || !isActiveEndValid) return;

    setIsSubmitting(true);
    try {
      const success = await completeTrip({ odometerEnd: activeEndNum });
      
      if (success && activeTrip.vehicleId) {
        await updateVehicleOdometer(activeTrip.vehicleId, activeEndNum);
        refetchMileage();
        onSuccess();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete trip.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscardTrip = async () => {
    setIsSubmitting(true);
    await discardTrip();
    setOdometerEnd("");
    setIsSubmitting(false);
  };

  // If there's an active GPS trip, show GPS tracker UI
  if (activeTrip && activeTrip.trackingMode === "gps") {
    return (
      <GpsTracker
        destination={activeTrip.endLocation}
        onComplete={handleGpsComplete}
        onCancel={handleDiscardTrip}
        isCompleting={isGpsCompleting}
      />
    );
  }

  // If there's an active odometer trip, show completion UI
  if (activeTrip && activeTrip.trackingMode === "odometer") {
    return (
      <div className="space-y-4">
        {/* Active Trip Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-foreground">Active Trip</span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard Trip?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this in-progress trip.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDiscardTrip} className="bg-destructive text-destructive-foreground">
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Trip Details */}
        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">To:</span>
            <span className="font-medium">{activeTrip.endLocation}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Vehicle:</span>
            <span className="font-medium">{activeTripVehicle?.name || "Unknown"}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Started:</span>
            <span className="font-medium">
              {format(activeTrip.startedAt, "h:mm a")} ({formatDistanceToNow(activeTrip.startedAt, { addSuffix: true })})
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground ml-6">Start Odometer:</span>
            <Badge variant="outline" className="font-mono">
              {activeTrip.odometerStart.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* End Odometer Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">End Odometer *</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Enter current odometer..."
            value={odometerEnd}
            onChange={(e) => setOdometerEnd(e.target.value)}
            className="h-14 text-xl font-semibold text-center"
            onFocus={(e) => e.target.select()}
          />
        </div>

        {/* Validation Warning */}
        {odometerEnd && !isActiveEndValid && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>End must be greater than start ({activeTrip.odometerStart.toLocaleString()})</span>
          </div>
        )}

        {/* Calculated Results */}
        {activeCalculatedMiles > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-primary/10 text-center">
              <p className="text-xs text-muted-foreground mb-1">Miles</p>
              <p className="text-2xl font-bold text-foreground">{activeCalculatedMiles.toFixed(1)}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 text-center">
              <p className="text-xs text-muted-foreground mb-1">Est. Deduction</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${activeEstimatedDeduction.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Complete Button */}
        <Button
          onClick={handleCompleteTrip}
          disabled={!isActiveEndValid || isSubmitting}
          className="w-full h-14 text-lg font-semibold touch-manipulation active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Complete Trip
            </>
          )}
        </Button>
      </div>
    );
  }

  // No active trip - show start trip form
  const selectedVehicle = selectedVehicleId ? getVehicleById(selectedVehicleId) : undefined;

  return (
    <div className="space-y-4">
      {/* Tracking Mode Selector */}
      <TrackingModeSelector
        value={trackingMode}
        onChange={setTrackingMode}
        disabled={isSubmitting}
      />

      {/* Route Quick Selector */}
      {routes.length > 0 && (
        <RouteQuickSelector
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={handleRouteSelect}
          locations={activeLocations}
          warehouseAddress={warehouseAddress}
        />
      )}

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
        onChange={handleFromChange}
        locations={activeLocations}
        warehouseAddress={warehouseAddress}
      />

      {/* To Location */}
      <LocationSelector
        type="to"
        value={toSelection}
        onChange={handleToChange}
        locations={activeLocations}
        warehouseAddress={warehouseAddress}
      />

      {/* Odometer Mode: Start Odometer Input */}
      {trackingMode === "odometer" && (
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
          <p className="text-xs text-muted-foreground">
            Enter your current reading. You'll add the end reading when you arrive.
          </p>
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

      {/* Start Trip Button */}
      {trackingMode === "odometer" ? (
        <Button
          onClick={handleStartTrip}
          disabled={isSubmitting || !selectedVehicleId || !odometerStart}
          className="w-full h-14 text-lg font-semibold touch-manipulation active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Start Trip
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={handleStartGpsTracking}
          disabled={isSubmitting || !selectedVehicleId}
          className="w-full h-14 text-lg font-semibold touch-manipulation active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Navigation className="h-5 w-5 mr-2" />
              Start GPS Tracking
            </>
          )}
        </Button>
      )}

      <p className="text-xs text-center text-muted-foreground">
        {trackingMode === "odometer" 
          ? "Trip will be saved. Return here to enter your end odometer when done."
          : "GPS will track your distance automatically. Keep this app open while driving."
        }
      </p>
    </div>
  );
}
