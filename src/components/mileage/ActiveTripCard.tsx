import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Car, MapPin, Clock, Trash2, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { ActiveTrip } from "@/hooks/useActiveTrip";
import { IRS_MILEAGE_RATE } from "@/hooks/useMileageDB";
import { format, formatDistanceToNow } from "date-fns";
import { useVehicles } from "@/hooks/useVehiclesDB";

interface ActiveTripCardProps {
  trip: ActiveTrip;
  onComplete: (odometerEnd: number) => Promise<boolean>;
  onDiscard: () => Promise<boolean>;
  onUpdateOdometer?: (odometerEnd: number) => void;
}

export function ActiveTripCard({
  trip,
  onComplete,
  onDiscard,
  onUpdateOdometer,
}: ActiveTripCardProps) {
  const { getVehicleById, updateVehicleOdometer } = useVehicles();
  const [odometerEnd, setOdometerEnd] = useState(trip.odometerEnd?.toString() || "");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const vehicle = getVehicleById(trip.vehicleId);
  const endNum = parseFloat(odometerEnd) || 0;
  const calculatedMiles = endNum > trip.odometerStart ? endNum - trip.odometerStart : 0;
  const estimatedDeduction = calculatedMiles * IRS_MILEAGE_RATE;
  const isValidOdometer = endNum > trip.odometerStart;
  const isEndLessThanStart = odometerEnd && endNum <= trip.odometerStart;

  // Debounced auto-save for odometer
  useEffect(() => {
    if (!odometerEnd || !isValidOdometer || !onUpdateOdometer) return;
    
    const timeoutId = setTimeout(() => {
      onUpdateOdometer(parseFloat(odometerEnd));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [odometerEnd, isValidOdometer, onUpdateOdometer]);

  const handleComplete = async () => {
    if (!isValidOdometer) return;
    
    setIsCompleting(true);
    const success = await onComplete(endNum);
    
    // Update vehicle's last recorded odometer
    if (success && trip.vehicleId) {
      await updateVehicleOdometer(trip.vehicleId, endNum);
    }
    
    setIsCompleting(false);
  };

  const handleDiscard = async () => {
    setIsDiscarding(true);
    await onDiscard();
    setIsDiscarding(false);
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Active Trip
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                disabled={isDiscarding}
              >
                {isDiscarding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard Trip?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this in-progress trip. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trip Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">To:</span>
            <span className="font-medium">{trip.endLocation}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Vehicle:</span>
            <span className="font-medium">{vehicle?.name || "Unknown"}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Started:</span>
            <span className="font-medium">
              {format(trip.startedAt, "h:mm a")} ({formatDistanceToNow(trip.startedAt, { addSuffix: true })})
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground ml-6">Start Odometer:</span>
            <Badge variant="outline" className="font-mono">
              {trip.odometerStart.toLocaleString()}
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
        {isEndLessThanStart && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>End must be greater than start ({trip.odometerStart.toLocaleString()})</span>
          </div>
        )}

        {/* Calculated Results */}
        {calculatedMiles > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-background/80 text-center">
              <p className="text-xs text-muted-foreground mb-1">Miles</p>
              <p className="text-2xl font-bold text-foreground">{calculatedMiles.toFixed(1)}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 text-center">
              <p className="text-xs text-muted-foreground mb-1">Est. Deduction</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${estimatedDeduction.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Complete Button */}
        <Button
          onClick={handleComplete}
          disabled={!isValidOdometer || isCompleting}
          className="w-full h-12 font-semibold gap-2"
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              Complete Trip
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
