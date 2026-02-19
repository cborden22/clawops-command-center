import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MileageRoute } from "@/hooks/useRoutesDB";
import { Vehicle } from "@/hooks/useVehiclesDB";
import { RouteRun, useRouteRun, StopResult } from "@/hooks/useRouteRun";
import { RouteRunSetup } from "./RouteRunSetup";
import { RouteRunStopView } from "./RouteRunStopView";
import { RouteRunSummary } from "./RouteRunSummary";
import { TrackingMode } from "./TrackingModeSelector";

type Phase = "setup" | "running" | "summary";

interface RouteRunPageProps {
  route: MileageRoute;
  vehicles: Vehicle[];
  activeRun: RouteRun | null;
  onStartRun: (params: {
    route: MileageRoute;
    vehicleId: string;
    trackingMode: "gps" | "odometer";
    odometerStart?: number;
    customStops?: import("@/hooks/useRoutesDB").RouteStop[];
  }) => Promise<RouteRun | null>;
  onCompleteStop: (result: StopResult) => Promise<boolean>;
  onCompleteRun: (params?: {
    odometerEnd?: number;
    gpsDistanceMeters?: number;
  }) => Promise<boolean>;
  onDiscardRun: () => Promise<boolean>;
  onExit: () => void;
  refetchMileage: () => void;
}

export function RouteRunPage({
  route,
  vehicles,
  activeRun,
  onStartRun,
  onCompleteStop,
  onCompleteRun,
  onDiscardRun,
  onExit,
  refetchMileage,
}: RouteRunPageProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  // Custom stops set during setup (filtered/reordered)
  const [runStops, setRunStops] = useState<import("@/hooks/useRoutesDB").RouteStop[] | null>(null);

  // The effective stops list for the active run
  const effectiveStops = runStops || route.stops;

  // Determine phase
  const phase: Phase = useMemo(() => {
    if (!activeRun) return "setup";
    if (activeRun.currentStopIndex >= effectiveStops.length) return "summary";
    return "running";
  }, [activeRun, effectiveStops.length]);

  const currentStop = phase === "running" && activeRun
    ? effectiveStops[activeRun.currentStopIndex]
    : null;

  const handleStart = async (vehicleId: string, trackingMode: TrackingMode, odometerStart?: number, customStops?: import("@/hooks/useRoutesDB").RouteStop[]) => {
    setIsStarting(true);
    if (customStops) setRunStops(customStops);
    await onStartRun({ route, vehicleId, trackingMode, odometerStart, customStops });
    setIsStarting(false);
  };

  const handleCompleteStop = async (result: StopResult) => {
    setIsCompleting(true);
    await onCompleteStop(result);
    setIsCompleting(false);
  };

  const handleFinish = async (odometerEnd?: number) => {
    setIsFinishing(true);
    const success = await onCompleteRun(
      odometerEnd ? { odometerEnd } : undefined
    );
    if (success) {
      refetchMileage();
      onExit();
    }
    setIsFinishing(false);
  };

  const handleDiscard = async () => {
    await onDiscardRun();
    onExit();
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onExit} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Routes
      </Button>

      {phase === "setup" && (
        <RouteRunSetup
          route={route}
          vehicles={vehicles}
          onStart={handleStart}
          onCancel={onExit}
          isStarting={isStarting}
        />
      )}

      {phase === "running" && currentStop && activeRun && (
        <RouteRunStopView
          stop={currentStop}
          stopIndex={activeRun.currentStopIndex}
          totalStops={effectiveStops.length}
          onComplete={handleCompleteStop}
          isCompleting={isCompleting}
        />
      )}

      {phase === "summary" && activeRun && (
        <RouteRunSummary
          run={activeRun}
          routeName={route.name}
          onFinish={handleFinish}
          onDiscard={handleDiscard}
          isFinishing={isFinishing}
        />
      )}
    </div>
  );
}
