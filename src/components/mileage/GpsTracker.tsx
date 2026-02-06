import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Navigation, Signal, Clock, MapPin, AlertTriangle, 
  Loader2, Square, CheckCircle 
} from "lucide-react";
import { useGpsTracking } from "@/hooks/useGpsTracking";
import { IRS_MILEAGE_RATE } from "@/hooks/useMileageDB";
import { cn } from "@/lib/utils";

interface GpsTrackerProps {
  destination: string;
  onComplete: (data: {
    distanceMiles: number;
    gpsDistanceMeters: number;
    startLat?: number;
    startLng?: number;
    endLat?: number;
    endLng?: number;
    elapsedSeconds: number;
  }) => void;
  onCancel: () => void;
  isCompleting?: boolean;
}

export function GpsTracker({
  destination,
  onComplete,
  onCancel,
  isCompleting = false,
}: GpsTrackerProps) {
  const {
    isTracking,
    distanceMiles,
    distanceMeters,
    currentPosition,
    startPosition,
    accuracy,
    elapsedSeconds,
    error,
    isPermissionDenied,
    startTracking,
    stopTracking,
    getSignalStrength,
  } = useGpsTracking();

  // Auto-start tracking when component mounts
  useEffect(() => {
    startTracking();
  }, [startTracking]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const signalStrength = getSignalStrength(accuracy);
  const estimatedDeduction = distanceMiles * IRS_MILEAGE_RATE;

  const handleComplete = () => {
    const result = stopTracking();
    onComplete({
      distanceMiles: result.distanceMiles,
      gpsDistanceMeters: result.distanceMeters,
      startLat: result.startPosition?.lat,
      startLng: result.startPosition?.lng,
      endLat: result.endPosition?.lat,
      endLng: result.endPosition?.lng,
      elapsedSeconds: result.elapsedSeconds,
    });
  };

  const handleCancel = () => {
    stopTracking();
    onCancel();
  };

  // Show permission denied state
  if (isPermissionDenied) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Location Access Required</h3>
              <p className="text-sm text-muted-foreground">
                Please enable location access in your browser settings to use GPS tracking.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onCancel} className="w-full">
            Use Manual Mode Instead
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error && !isTracking) {
    return (
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">GPS Issue</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={startTracking} className="flex-1">
              Try Again
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Use Manual Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tracking Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-3 w-3 rounded-full animate-pulse",
            isTracking ? "bg-red-500" : "bg-muted"
          )} />
          <span className="font-semibold text-foreground">
            {isTracking ? "Tracking Active" : "Tracking Stopped"}
          </span>
        </div>
        {isTracking && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-muted-foreground hover:text-destructive"
          >
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>
        )}
      </div>

      {/* Main Stats */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Distance</p>
            <p className="text-5xl font-bold text-foreground tracking-tight">
              {distanceMiles.toFixed(2)}
            </p>
            <p className="text-lg text-muted-foreground">miles</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">Est. Deduction</p>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                ${estimatedDeduction.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
              <p className="text-xl font-semibold text-foreground">
                {formatTime(elapsedSeconds)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GPS Signal Status */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Signal className={cn(
            "h-5 w-5",
            signalStrength === "Excellent" || signalStrength === "Good" 
              ? "text-green-500" 
              : signalStrength === "Fair" 
                ? "text-amber-500" 
                : "text-red-500"
          )} />
          <span className="text-sm font-medium">Signal: {signalStrength}</span>
        </div>
        {accuracy && (
          <Badge variant="outline" className="text-xs">
            ±{Math.round(accuracy)}m
          </Badge>
        )}
      </div>

      {/* Destination */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
        <MapPin className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">Destination</p>
          <p className="text-sm font-medium">{destination}</p>
        </div>
      </div>

      {/* Error Warning (non-blocking) */}
      {error && isTracking && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Complete Button */}
      <Button
        onClick={handleComplete}
        disabled={isCompleting || distanceMiles < 0.1}
        className="w-full h-14 text-lg font-semibold gap-2"
      >
        {isCompleting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5" />
            Complete & Save Trip
          </>
        )}
      </Button>

      {distanceMiles < 0.1 && (
        <p className="text-xs text-center text-muted-foreground">
          Start moving to record distance
        </p>
      )}
    </div>
  );
}
