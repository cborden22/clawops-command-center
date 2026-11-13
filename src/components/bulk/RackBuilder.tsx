import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCenter, type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Plus, Trash2, Layers, Save, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BulkMachineHead } from "./BulkMachineHead";
import { BULK_TYPES, VEND_PRICES, money, newMachine, rackStats, type BulkMachineType, type BulkRack, type BulkMachine } from "@/lib/bulkVending";
import { saveRack } from "@/hooks/useBulkRacks";

const stop = (e: React.KeyboardEvent) => e.stopPropagation();

function PaletteItem({ type, active, onSelect }: { type: BulkMachineType; active: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette:${type}` });
  const t = BULK_TYPES[type];
  return (
    <button
      ref={setNodeRef} {...listeners} {...attributes} type="button" onClick={onSelect}
      className={cn("flex min-h-11 w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors touch-none",
        active ? "border-primary bg-primary/10" : "border-border hover:bg-muted", isDragging && "opacity-50")}
    >
      <span className="shrink-0 rounded-sm" style={{ background: t.swatch, width: 12, height: t.tall ? 22 : 14 }} />
      <span className="min-w-0 truncate">{t.label}</span>
    </button>
  );
}

function SortableHead({ m, selected, onClick }: { m: BulkMachine; selected: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}
      className={cn("touch-none", isDragging && "opacity-40")}>
      <BulkMachineHead machine={m} selected={selected} onClick={onClick} />
    </div>
  );
}

function TierRow({ tierId, index, children, onAdd, onDelete, canDelete }: { tierId: string; index: number; children: React.ReactNode; onAdd: () => void; onDelete: () => void; canDelete: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `tier:${tierId}` });
  return (
    <div className={cn("rounded-lg border bg-card/60 p-2", isOver && "border-primary")}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tier {index + 1}</span>
        {canDelete && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete} aria-label="Delete tier">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div ref={setNodeRef} className="flex min-h-[90px] flex-wrap items-end gap-1">
        {children}
        <button type="button" onClick={onAdd}
          className="flex h-[90px] w-16 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
          aria-label="Add machine to tier">
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

interface Props { open: boolean; onOpenChange: (o: boolean) => void; rack: BulkRack | null; isNew: boolean; onSaved: () => void }

export function RackBuilder({ open, onOpenChange, rack: initial, isNew, onSaved }: Props) {
  const [rack, setRack] = useState<BulkRack | null>(initial);
  const [paletteType, setPaletteType] = useState<BulkMachineType>("2in_capsule");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // reset when a different rack is opened
  const [lastId, setLastId] = useState(initial?.id);
  if (initial?.id !== lastId) { setLastId(initial?.id); setRack(initial); setSelectedId(null); }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const stats = useMemo(() => rackStats(rack ? [rack] : []), [rack]);
  const selected = rack?.tiers.flatMap((t) => t.machines).find((m) => m.id === selectedId) || null;
  if (!rack) return null;

  const findTier = (id: string) => {
    if (id.startsWith("tier:")) return id.slice(5);
    return rack.tiers.find((t) => t.machines.some((m) => m.id === id))?.id;
  };
  const addTo = (tierId: string, type = paletteType, at?: number) => {
    const m = newMachine(type);
    setRack({ ...rack, tiers: rack.tiers.map((t) => t.id !== tierId ? t : { ...t, machines: at === undefined ? [...t.machines, m] : [...t.machines.slice(0, at), m, ...t.machines.slice(at)] }) });
    setSelectedId(m.id);
  };
  const patchSelected = (p: Partial<BulkMachine>) =>
    setRack({ ...rack, tiers: rack.tiers.map((t) => ({ ...t, machines: t.machines.map((m) => (m.id === selectedId ? { ...m, ...p } : m)) })) });
  const removeSelected = () => {
    setRack({ ...rack, tiers: rack.tiers.map((t) => ({ ...t, machines: t.machines.filter((m) => m.id !== selectedId) })) });
    setSelectedId(null);
  };

  const onDragStart = (e: DragStartEvent) => setDragging(String(e.active.id));
  const onDragOver = (e: DragOverEvent) => {
    const a = String(e.active.id); const o = e.over && String(e.over.id);
    if (!o || a.startsWith("palette:")) return;
    const from = findTier(a), to = findTier(o);
    if (!from || !to || from === to) return;
    setRack((r) => {
      if (!r) return r;
      const m = r.tiers.find((t) => t.id === from)!.machines.find((x) => x.id === a)!;
      return { ...r, tiers: r.tiers.map((t) => {
        if (t.id === from) return { ...t, machines: t.machines.filter((x) => x.id !== a) };
        if (t.id === to) {
          const idx = t.machines.findIndex((x) => x.id === o);
          const ms = [...t.machines]; ms.splice(idx < 0 ? ms.length : idx, 0, m);
          return { ...t, machines: ms };
        }
        return t;
      }) };
    });
  };
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const a = String(e.active.id); const o = e.over && String(e.over.id);
    if (!o) return;
    const tierId = findTier(o);
    if (!tierId) return;
    if (a.startsWith("palette:")) {
      const tier = rack.tiers.find((t) => t.id === tierId)!;
      const idx = tier.machines.findIndex((m) => m.id === o);
      addTo(tierId, a.slice(8) as BulkMachineType, idx < 0 ? undefined : idx);
      return;
    }
    setRack({ ...rack, tiers: rack.tiers.map((t) => {
      if (t.id !== tierId) return t;
      const oi = t.machines.findIndex((m) => m.id === a), ni = t.machines.findIndex((m) => m.id === o);
      return oi >= 0 && ni >= 0 && oi !== ni ? { ...t, machines: arrayMove(t.machines, oi, ni) } : t;
    }) });
  };

  const handleSave = async () => {
    setSaving(true);
    try { await saveRack(rack, isNew); toast.success("Rack saved"); onSaved(); onOpenChange(false); }
    catch (err: any) { toast.error(err.message || "Could not save rack"); }
    finally { setSaving(false); }
  };

  const draggingMachine = dragging && !dragging.startsWith("palette:") ? rack.tiers.flatMap((t) => t.machines).find((m) => m.id === dragging) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] max-w-5xl flex-col p-4 sm:p-6">
        <DialogHeader><DialogTitle>{isNew ? "New bulk rack" : "Edit bulk rack"}</DialogTitle></DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div><Label>Rack name</Label><Input value={rack.name} onKeyDown={stop} onChange={(e) => setRack({ ...rack, name: e.target.value })} placeholder="Front entrance rack" /></div>
            <div><Label>Notes</Label><Input value={rack.notes || ""} onKeyDown={stop} onChange={(e) => setRack({ ...rack, notes: e.target.value })} placeholder="Optional" /></div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
            <div className="flex flex-col gap-4 md:flex-row">
              <aside className="md:w-48 shrink-0 space-y-2">
                <p className="text-xs text-muted-foreground">Tap a type, then tap + on a tier. Or drag it onto a tier.</p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                  {(Object.keys(BULK_TYPES) as BulkMachineType[]).map((t) => (
                    <PaletteItem key={t} type={t} active={paletteType === t} onSelect={() => setPaletteType(t)} />
                  ))}
                </div>
              </aside>
              <div className="flex-1 min-w-0 space-y-2">
                {rack.tiers.map((tier, i) => (
                  <TierRow key={tier.id} tierId={tier.id} index={i} canDelete={rack.tiers.length > 1}
                    onAdd={() => addTo(tier.id)}
                    onDelete={() => setRack({ ...rack, tiers: rack.tiers.filter((t) => t.id !== tier.id) })}>
                    <SortableContext items={tier.machines.map((m) => m.id)} strategy={horizontalListSortingStrategy}>
                      {tier.machines.map((m) => (
                        <SortableHead key={m.id} m={m} selected={m.id === selectedId} onClick={() => setSelectedId(m.id)} />
                      ))}
                    </SortableContext>
                  </TierRow>
                ))}
                <Button variant="outline" size="sm" onClick={() => setRack({ ...rack, tiers: [...rack.tiers, { id: crypto.randomUUID(), machines: [] }] })}>
                  <Layers className="h-4 w-4" /> Add tier
                </Button>
              </div>
            </div>
            <DragOverlay>
              {draggingMachine ? <BulkMachineHead machine={draggingMachine} /> : dragging ? (
                <div className="rounded-md border bg-card px-2 py-1 text-xs shadow">{BULK_TYPES[dragging.slice(8) as BulkMachineType].label}</div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Total heads", String(stats.heads), ""],
              ["Need refill", String(stats.low), stats.low ? "text-destructive" : ""],
              ["Unlabeled", String(stats.unlabeled), ""],
              ["Avg vend price", money(stats.avgPrice), ""],
            ].map(([l, v, c]) => (
              <Card key={l}><CardContent className="p-3"><p className="text-xs text-muted-foreground truncate">{l}</p><p className={cn("text-lg font-semibold tabular-nums", c)}>{v}</p></CardContent></Card>
            ))}
          </div>

          {selected ? (
            <Card className="mt-4"><CardContent className="grid gap-4 p-4 sm:grid-cols-2">
              <div><Label>Product name</Label><Input value={selected.product_name || ""} onKeyDown={stop} onChange={(e) => patchSelected({ product_name: e.target.value })} placeholder="e.g. Sour Skittles" /></div>
              <div><Label>Vend price</Label>
                <Select value={String(selected.vend_price)} onValueChange={(v) => patchSelected({ vend_price: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VEND_PRICES.map((p) => <SelectItem key={p} value={String(p)}>{money(p)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Machine type</Label>
                <Select value={selected.machine_type} onValueChange={(v) => patchSelected({ machine_type: v as BulkMachineType, capacity: BULK_TYPES[v as BulkMachineType].capacity })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(BULK_TYPES) as BulkMachineType[]).map((t) => <SelectItem key={t} value={t}>{BULK_TYPES[t].label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Fill level: {selected.fill_percent}%</Label>
                <Slider className="mt-3" min={0} max={100} step={5} value={[selected.fill_percent]} onValueChange={([v]) => patchSelected({ fill_percent: v })} />
              </div>
              <div><Label>Capacity</Label><p className="text-sm text-muted-foreground">~{selected.capacity ?? BULK_TYPES[selected.machine_type].capacity} {BULK_TYPES[selected.machine_type].capUnit}</p></div>
              <div><Label>Last restocked</Label><p className="text-sm text-muted-foreground">{selected.last_restocked_at ? format(new Date(selected.last_restocked_at), "MMM d, yyyy h:mm a") : "Never"}</p></div>
              <div className="sm:col-span-2"><Button variant="ghost" size="sm" className="text-destructive" onClick={removeSelected}><Trash2 className="h-4 w-4" /> Remove machine</Button></div>
            </CardContent></Card>
          ) : (
            <p className="mt-4 text-center text-sm text-muted-foreground">Tap a machine to edit it.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save rack</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
