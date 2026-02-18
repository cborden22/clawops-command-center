import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MapPin, Coins, Route as RouteIcon } from "lucide-react";
import { RouteRun, StopResult } from "@/hooks/useRouteRun";

interface RouteRunSummaryProps {
  run: RouteRun;
  routeName: string;
  onFinish: (odometerEnd?: number) => Promise<void>;
  onDiscard: () => Promise<void>;
  isFinishing: boolean;
}

export function RouteRunSummary({ run, routeName, onFinish, onDiscard, isFinishing }: RouteRunSummaryProps) {
  const [odometerEnd, setOdometerEnd] = useState("");

  const totalCoins = run.stopData.reduce(
    (sum, s) => sum + s.collections.reduce((cs, c) => cs + c.coinsInserted, 0),
    0
  );
  const totalPrizes = run.stopData.reduce(
    (sum, s) => sum + s.collections.reduce((cs, c) => cs + c.prizesWon, 0),
    0
  );
  const stopsCompleted = run.stopData.length;
  const commissionsHandled = run.stopData.filter((s) => s.commissionPaid).length;

  const handleFinish = async () => {
    const odoEnd = run.trackingMode === "odometer" ? parseFloat(odometerEnd) || undefined : undefined;
    await onFinish(odoEnd);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* Success Header */}
      <div className="text-center space-y-2 pt-4">
        <div className="inline-flex p-3 rounded-full bg-primary/10 mb-2">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Route Complete!</h2>
        <p className="text-sm text-muted-foreground">{routeName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-foreground">{stopsCompleted}</p>
            <p className="text-xs text-muted-foreground">Stops Visited</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Coins className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-foreground">{totalCoins}</p>
            <p className="text-xs text-muted-foreground">Coins Collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Stop Details */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Stop Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {run.stopData.map((stop, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {i + 1}
                </Badge>
                <span className="text-sm truncate text-foreground">{stop.locationName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                {stop.collections.some((c) => c.coinsInserted > 0) && (
                  <span>{stop.collections.reduce((s, c) => s + c.coinsInserted, 0)} coins</span>
                )}
                {stop.commissionPaid && (
                  <Badge variant="secondary" className="text-[10px]">Paid</Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Odometer End (if odometer mode) */}
      {run.trackingMode === "odometer" && (
        <Card className="glass-card">
          <CardContent className="p-4 space-y-2">
            <Label>Ending Odometer</Label>
            <NumberInput
              placeholder="Enter final odometer reading"
              value={odometerEnd}
              onChange={(e) => setOdometerEnd(e.target.value)}
              inputMode="numeric"
              className="h-12 text-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3 pb-6">
        <Button
          onClick={handleFinish}
          disabled={isFinishing || (run.trackingMode === "odometer" && !odometerEnd)}
          className="w-full h-14 text-base gap-2"
        >
          <RouteIcon className="h-5 w-5" />
          {isFinishing ? "Saving..." : "Finish Route"}
        </Button>
        <Button
          variant="ghost"
          onClick={onDiscard}
          className="w-full text-destructive hover:text-destructive"
        >
          Discard Route Run
        </Button>
      </div>
    </div>
  );
}
