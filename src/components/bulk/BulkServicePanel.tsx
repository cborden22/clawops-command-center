import { useState } from "react";
import { Candy, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useBulkRacks, updateBulkMachine } from "@/hooks/useBulkRacks";
import { rackStats } from "@/lib/bulkVending";
import { BulkMachineHead } from "./BulkMachineHead";

/** Compact rack view for route stops: tap a head, adjust fill, or mark restocked. */
export function BulkServicePanel({ locationId }: { locationId: string }) {
  const { racks, loading, reload } = useBulkRacks(locationId);
  const [sel, setSel] = useState<string | null>(null);
  const [fill, setFill] = useState(100);
  const [busy, setBusy] = useState(false);
  if (loading || racks.length === 0) return null;

  const machine = racks.flatMap((r) => r.tiers.flatMap((t) => t.machines)).find((m) => m.id === sel);
  const s = rackStats(racks);

  const save = async (patch: { fill_percent: number; last_restocked_at?: string }) => {
    if (!sel) return;
    setBusy(true);
    try { await updateBulkMachine(sel, patch); toast.success(patch.last_restocked_at ? "Marked restocked" : "Fill updated"); await reload(); }
    catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><Candy className="h-4 w-4" /> Bulk vending
          {s.low > 0 && <span className="text-xs font-normal text-destructive">{s.low} need refill</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {racks.map((r) => (
          <div key={r.id} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{r.name}</p>
            {r.tiers.map((t) => (
              <div key={t.id} className="flex flex-wrap items-end gap-1">
                {t.machines.map((m) => (
                  <BulkMachineHead key={m.id} machine={m} compact selected={m.id === sel}
                    onClick={() => { setSel(m.id); setFill(m.fill_percent); }} />
                ))}
              </div>
            ))}
          </div>
        ))}
        {machine && (
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium truncate">{machine.product_name || "Unlabeled"} · {fill}%</p>
            <Slider min={0} max={100} step={5} value={[fill]} onValueChange={([v]) => setFill(v)} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => save({ fill_percent: fill })}>Save fill</Button>
              <Button className="min-h-11" disabled={busy} onClick={() => { setFill(100); save({ fill_percent: 100, last_restocked_at: new Date().toISOString() }); }}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Restocked
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
