import { useState } from "react";
import { Plus, Pencil, Trash2, Candy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useBulkRacks, deleteRack } from "@/hooks/useBulkRacks";
import { rackStats, type BulkRack } from "@/lib/bulkVending";
import { BulkMachineHead } from "./BulkMachineHead";
import { RackBuilder } from "./RackBuilder";

export function BulkTab({ locationId }: { locationId: string }) {
  const { racks, loading, reload } = useBulkRacks(locationId);
  const [editing, setEditing] = useState<{ rack: BulkRack; isNew: boolean } | null>(null);

  const startNew = () => setEditing({ isNew: true, rack: { id: crypto.randomUUID(), location_id: locationId, name: `Rack ${racks.length + 1}`, notes: null, tiers: [{ id: crypto.randomUUID(), machines: [] }] } });

  const remove = async (r: BulkRack) => {
    if (!confirm(`Delete "${r.name}" and all its machines?`)) return;
    try { await deleteRack(r.id); toast.success("Rack deleted"); reload(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Bulk vending racks at this location</p>
        <Button size="sm" onClick={startNew}><Plus className="h-4 w-4" /> Add rack</Button>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : racks.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <Candy className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No bulk racks yet.</p>
        </CardContent></Card>
      ) : racks.map((r) => {
        const s = rackStats([r]);
        return (
          <Card key={r.id}><CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{r.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="secondary">{s.heads} heads</Badge>
                  {s.low > 0 && <Badge variant="destructive">{s.low} need refill</Badge>}
                  {s.unlabeled > 0 && <Badge variant="outline">{s.unlabeled} unlabeled</Badge>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="outline" size="sm" onClick={() => setEditing({ rack: r, isNew: false })}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => remove(r)} aria-label="Delete rack"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            {r.tiers.map((t) => (
              <div key={t.id} className="flex flex-wrap items-end gap-1 rounded-md bg-muted/30 p-1">
                {t.machines.length ? t.machines.map((m) => <BulkMachineHead key={m.id} machine={m} compact />) : <span className="p-2 text-xs text-muted-foreground">Empty tier</span>}
              </div>
            ))}
          </CardContent></Card>
        );
      })}
      {editing && (
        <RackBuilder open onOpenChange={(o) => !o && setEditing(null)} rack={editing.rack} isNew={editing.isNew} onSaved={reload} />
      )}
    </div>
  );
}
