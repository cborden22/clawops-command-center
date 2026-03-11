import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, XCircle } from "lucide-react";
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
import { MileageRoute } from "@/hooks/useRoutesDB";
import { Vehicle } from "@/hooks/useVehiclesDB";
import { RouteRun, useRouteRun, StopResult } from "@/hooks/useRouteRun";
import { RouteRunSetup } from "./RouteRunSetup";
import { RouteRunStopView } from "./RouteRunStopView";
import { RouteRunSummary } from "./RouteRunSummary";

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
  onGoToStop: (index: number) => Promise<boolean>;
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
  onGoToStop,
  onExit,
  refetchMileage,
}: RouteRunPageProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [runStops, setRunStops] = useState<import("@/hooks/useRoutesDB").RouteStop[] | null>(null);

  const effectiveStops = runStops || route.stops;

  const phase: Phase = useMemo(() => {
    if (!activeRun) return "setup";
    if (activeRun.currentStopIndex >= effectiveStops.length) return "summary";
    return "running";
  }, [activeRun, effectiveStops.length]);

  const currentStop = phase === "running" && activeRun
    ? effectiveStops[activeRun.currentStopIndex]
    : null;

  const handleStart = async (vehicleId: string, trackingMode: "odometer", odometerStart?: number, customStops?: import("@/hooks/useRoutesDB").RouteStop[]) => {
    setIsStarting(true);
    if (customStops) setRunStops(customStops);
    await onStartRun({ route, vehicleId, trackingMode: "odometer", odometerStart, customStops });
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

  const handleGoBack = async () => {
    if (activeRun && activeRun.currentStopIndex > 0) {
      await onGoToStop(activeRun.currentStopIndex - 1);
    }
  };

  return (
    <div className="space-y-4">
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
        <>
          <RouteRunStopView
            stop={currentStop}
            stopIndex={activeRun.currentStopIndex}
            totalStops={effectiveStops.length}
            onComplete={handleCompleteStop}
            onGoBack={activeRun.currentStopIndex > 0 ? handleGoBack : undefined}
            isCompleting={isCompleting}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive gap-2 mt-2">
                <XCircle className="h-4 w-4" />
                Cancel Route Run
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Route Run?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will discard all progress and collected data for this run. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Running</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDiscard}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Discard Run
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
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
