import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NumberInput } from "@/components/ui/number-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin, ChevronRight, ChevronLeft, DollarSign, StickyNote, Coins, Locate, CheckCircle2
} from "lucide-react";
import { RouteStop } from "@/hooks/useRoutesDB";
import { StopCollectionData, StopResult } from "@/hooks/useRouteRun";
import { supabase } from "@/integrations/supabase/client";

interface LocationMachine {
  id: string;
  machineType: string;
  customLabel?: string;
  costPerPlay?: number;
}

interface PendingCommission {
  id: string;
  amount: number;
  period: string;
}

interface RouteRunStopViewProps {
  stop: RouteStop;
  stopIndex: number;
  totalStops: number;
  onComplete: (result: StopResult) => Promise<void>;
  onGoBack?: () => void;
  isCompleting: boolean;
}

export function RouteRunStopView({
  stop,
  stopIndex,
  totalStops,
  onComplete,
  onGoBack,
  isCompleting,
}: RouteRunStopViewProps) {
  const [machines, setMachines] = useState<LocationMachine[]>([]);
  const [collections, setCollections] = useState<Record<string, { coins: string; prizes: string }>>({});
  const [notes, setNotes] = useState("");
  const [pendingCommission, setPendingCommission] = useState<PendingCommission | null>(null);
  const [payCommission, setPayCommission] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [resolvedLocationName, setResolvedLocationName] = useState<string | null>(null);
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const locationName = resolvedLocationName || stop.customLocationName || `Stop ${stopIndex + 1}`;
  const isLastStop = stopIndex === totalStops - 1;
  const progressPercent = ((stopIndex + 1) / totalStops) * 100;

  // Reset GPS state when stop changes
  useEffect(() => {
    setGpsPosition(null);
    setGpsError(null);
    setGpsLoading(false);
  }, [stopIndex]);

  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported by your browser");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGpsLoading(false);
      },
      (err) => {
        const msg = err.code === err.PERMISSION_DENIED
          ? "Location permission denied. Enable it in browser settings."
          : err.code === err.POSITION_UNAVAILABLE
          ? "Location unavailable. Check GPS signal."
          : "Location request timed out.";
        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  // Fetch machines and pending commissions for this location
  useEffect(() => {
    const fetchLocationData = async () => {
      setLoadingData(true);
      setCollections({});
      setNotes("");
      setPayCommission(false);
      setPendingCommission(null);
      setResolvedLocationName(null);

      if (!stop.locationId) {
        setMachines([]);
        setLoadingData(false);
        return;
      }

      try {
        // Fetch location name
        const { data: locData } = await supabase
          .from("locations")
          .select("name")
          .eq("id", stop.locationId)
          .maybeSingle();
        if (locData?.name) {
          setResolvedLocationName(locData.name);
        }

        // Fetch machines
        const { data: machineData } = await supabase
          .from("location_machines")
          .select("id, machine_type, custom_label, cost_per_play")
          .eq("location_id", stop.locationId);

        const mapped: LocationMachine[] = (machineData || []).map((m) => ({
          id: m.id,
          machineType: m.machine_type,
          customLabel: m.custom_label || undefined,
          costPerPlay: m.cost_per_play ? Number(m.cost_per_play) : undefined,
        }));
        setMachines(mapped);

        // Initialize collections state
        const initialCollections: Record<string, { coins: string; prizes: string }> = {};
        mapped.forEach((m) => {
          initialCollections[m.id] = { coins: "", prizes: "" };
        });
        setCollections(initialCollections);

        // Fetch unpaid commissions
        const { data: commData } = await supabase
          .from("commission_summaries")
          .select("id, commission_amount, start_date, end_date")
          .eq("location_id", stop.locationId)
          .eq("commission_paid", false)
          .order("end_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (commData && commData.commission_amount) {
          setPendingCommission({
            id: commData.id,
            amount: Number(commData.commission_amount),
            period: `${commData.start_date} - ${commData.end_date}`,
          });
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchLocationData();
  }, [stop.locationId, stopIndex]);

  const handleComplete = async () => {
    const collData: StopCollectionData[] = machines.map((m) => ({
      machineId: m.id,
      coinsInserted: parseInt(collections[m.id]?.coins || "0") || 0,
      prizesWon: parseInt(collections[m.id]?.prizes || "0") || 0,
    }));

    const result: StopResult = {
      stopIndex,
      locationId: stop.locationId || undefined,
      locationName,
      collections: collData,
      notes: notes.trim(),
      commissionPaid: payCommission,
      commissionSummaryId: payCommission ? pendingCommission?.id : undefined,
      completedAt: new Date().toISOString(),
      gpsLat: gpsPosition?.lat,
      gpsLng: gpsPosition?.lng,
      gpsAccuracy: gpsPosition?.accuracy,
    };

    await onComplete(result);
  };

  const updateCollection = (machineId: string, field: "coins" | "prizes", value: string) => {
    setCollections((prev) => ({
      ...prev,
      [machineId]: { ...prev[machineId], [field]: value },
    }));
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Stop {stopIndex + 1} of {totalStops}
          </span>
          <span className="font-medium text-foreground">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Stop Header */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground text-lg truncate">
                {locationName}
              </h2>
              {stop.milesFromPrevious > 0 && (
                <p className="text-xs text-muted-foreground">
                  {stop.milesFromPrevious.toFixed(1)} mi from previous stop
                </p>
              )}
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {stopIndex + 1}/{totalStops}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Current Location GPS */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Locate className="h-4 w-4 text-primary" />
              Current Location
            </div>
            {gpsPosition && (
              <Badge variant="secondary" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Captured
              </Badge>
            )}
          </div>

          {gpsPosition ? (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <p className="text-sm text-foreground font-mono">
                {gpsPosition.lat.toFixed(6)}, {gpsPosition.lng.toFixed(6)}
              </p>
              <p className="text-xs text-muted-foreground">
                Accuracy: ±{Math.round(gpsPosition.accuracy)}m
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-8 text-xs"
                onClick={captureCurrentLocation}
                disabled={gpsLoading}
              >
                <Locate className="h-3.5 w-3.5 mr-1" />
                Recapture
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 gap-2"
                onClick={captureCurrentLocation}
                disabled={gpsLoading}
              >
                <Locate className="h-4 w-4" />
                {gpsLoading ? "Getting Location..." : "Use Current Location"}
              </Button>
              {gpsError && (
                <p className="text-xs text-destructive">{gpsError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Optional – captures your GPS coordinates at this stop
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Machine Collections */}
      {machines.length > 0 && !loadingData && (
        <Card className="glass-card">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Coins className="h-4 w-4 text-primary" />
              Machine Collections
            </div>

            {machines.map((machine) => (
              <div key={machine.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                <p className="font-medium text-sm text-foreground">
                  {machine.customLabel || machine.machineType}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Coins In</Label>
                    <NumberInput
                      placeholder="0"
                      value={collections[machine.id]?.coins || ""}
                      onChange={(e) => updateCollection(machine.id, "coins", e.target.value)}
                      inputMode="numeric"
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Prizes Won</Label>
                    <NumberInput
                      placeholder="0"
                      value={collections[machine.id]?.prizes || ""}
                      onChange={(e) => updateCollection(machine.id, "prizes", e.target.value)}
                      inputMode="numeric"
                      className="h-11 text-base"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No machines message for linked locations */}
      {stop.locationId && machines.length === 0 && !loadingData && (
        <Card className="glass-card">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            No machines found at this location.
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <StickyNote className="h-4 w-4 text-primary" />
            Notes
          </Label>
          <Textarea
            placeholder="Add any notes about this stop..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Commission Prompt */}
      {pendingCommission && (
        <Card className="glass-card border-accent/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <DollarSign className="h-4 w-4 text-accent-foreground" />
              Pending Commission
            </div>
            <p className="text-sm text-muted-foreground">
              ${pendingCommission.amount.toFixed(2)} due for period {pendingCommission.period}
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="pay-commission"
                checked={payCommission}
                onCheckedChange={(checked) => setPayCommission(checked === true)}
              />
              <Label htmlFor="pay-commission" className="text-sm cursor-pointer">
                Mark commission as paid
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons - sticky on mobile */}
      <div className="sticky bottom-4 z-10 pt-2 flex gap-3">
        {stopIndex > 0 && onGoBack && (
          <Button
            variant="outline"
            onClick={onGoBack}
            disabled={isCompleting || loadingData}
            className="h-14 px-4 gap-1 shadow-lg"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>
        )}
        <Button
          onClick={handleComplete}
          disabled={isCompleting || loadingData}
          className="flex-1 h-14 text-base gap-2 shadow-lg"
        >
          {isCompleting ? (
            "Saving..."
          ) : isLastStop ? (
            "Complete Last Stop"
          ) : (
            <>
              Next Stop
              <ChevronRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
