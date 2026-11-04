import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Row = { id: string; label: string; unit: string | null; location: string; original: string };
type Filter = "all" | "missing" | "mapped";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onSaved?: () => void }

export function BulkNayaxIdEditor({ open, onOpenChange, onSaved }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [unmatched, setUnmatched] = useState<{ id: string; name: string | null; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const [{ data: m }, { data: tx }] = await Promise.all([
        supabase.from("location_machines")
          .select("id, machine_type, custom_label, unit_code, nayax_machine_id, locations(name)")
          .order("location_id"),
        supabase.from("nayax_transactions").select("nayax_machine_id, machine_name")
          .is("machine_id", null).not("nayax_machine_id", "is", null).limit(5000),
      ]);
      const r: Row[] = (m ?? []).map((x: any) => ({
        id: x.id,
        label: x.custom_label || x.machine_type,
        unit: x.unit_code,
        location: x.locations?.name ?? "—",
        original: x.nayax_machine_id ?? "",
      })).sort((a, b) => a.location.localeCompare(b.location) || a.label.localeCompare(b.label));
      setRows(r);
      setValues(Object.fromEntries(r.map((x) => [x.id, x.original])));
      const agg = new Map<string, { name: string | null; count: number }>();
      (tx ?? []).forEach((t: any) => {
        const k = String(t.nayax_machine_id).trim();
        const e = agg.get(k) ?? { name: t.machine_name, count: 0 };
        e.count++; agg.set(k, e);
      });
      setUnmatched([...agg].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.count - a.count));
      setLoading(false);
    })();
  }, [open]);

  const assigned = useMemo(() => new Set(Object.values(values).map((v) => v.trim()).filter(Boolean)), [values]);
  const suggestions = unmatched.filter((u) => !assigned.has(u.id));
  const dupes = useMemo(() => {
    const c = new Map<string, number>();
    Object.values(values).forEach((v) => { const t = v.trim(); if (t) c.set(t, (c.get(t) ?? 0) + 1); });
    return new Set([...c].filter(([, n]) => n > 1).map(([k]) => k));
  }, [values]);
  const changed = rows.filter((r) => (values[r.id] ?? "").trim() !== r.original.trim());
  const mappedCount = rows.filter((r) => (values[r.id] ?? "").trim()).length;

  const visible = rows.filter((r) => {
    const v = (values[r.id] ?? "").trim();
    if (filter === "missing" && v) return false;
    if (filter === "mapped" && !v) return false;
    const s = q.toLowerCase();
    return !s || r.label.toLowerCase().includes(s) || r.location.toLowerCase().includes(s) || v.includes(s);
  });

  const save = async () => {
    if (dupes.size) return toast({ title: "Duplicate IDs", description: "Each Nayax ID can only be on one machine.", variant: "destructive" });
    setSaving(true);
    let linked = 0;
    for (const r of changed) {
      const v = (values[r.id] ?? "").trim() || null;
      const { error } = await supabase.from("location_machines").update({ nayax_machine_id: v }).eq("id", r.id);
      if (error) { setSaving(false); return toast({ title: `Couldn't save ${r.label}`, description: error.message, variant: "destructive" }); }
      // unlink sales from the old ID, then link sales with the new ID
      await supabase.from("nayax_transactions").update({ machine_id: null }).eq("machine_id", r.id);
      if (v) {
        const { data } = await supabase.from("nayax_transactions").update({ machine_id: r.id })
          .eq("nayax_machine_id", v).select("id");
        linked += data?.length ?? 0;
      }
    }
    setSaving(false);
    toast({ title: `Saved ${changed.length} machine${changed.length === 1 ? "" : "s"}`, description: linked ? `${linked} past sales now linked.` : undefined });
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Nayax machine IDs</DialogTitle>
          <DialogDescription>
            {mappedCount} of {rows.length} machines have an ID{rows.length - mappedCount ? ` · ${rows.length - mappedCount} need one` : ""}.
          </DialogDescription>
        </DialogHeader>

        {suggestions.length > 0 && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm space-y-2">
            <p className="font-medium">IDs from your sales reports that aren't on a machine yet{focused ? " — tap one to use it for the selected machine" : " — select a machine box, then tap one"}:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 12).map((s) => (
                <Button key={s.id} size="sm" variant="outline" disabled={!focused}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => focused && setValues((p) => ({ ...p, [focused]: s.id }))}>
                  {s.id}{s.name ? ` · ${s.name}` : ""} ({s.count})
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search machine or location" value={q} className="pl-8"
              onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
          </div>
          <div className="flex gap-1">
            {(["all", "missing", "mapped"] as Filter[]).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
                {f === "missing" ? "Missing ID" : f === "mapped" ? "Has ID" : "All"}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-md border divide-y">
          {loading ? (
            <div className="p-8 flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-primary" /></div>
          ) : visible.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No machines match.</p>
          ) : visible.map((r, i) => {
            const v = values[r.id] ?? "";
            const isDupe = dupes.has(v.trim());
            return (
              <div key={r.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.label}{r.unit && <span className="text-muted-foreground font-normal"> · {r.unit}</span>}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.location}</p>
                </div>
                {v.trim() !== r.original.trim() && <Badge variant="secondary">Changed</Badge>}
                <Input
                  data-row={i}
                  value={v}
                  placeholder="Nayax ID"
                  className={`w-40 font-mono ${isDupe ? "border-destructive" : ""}`}
                  onFocus={(e) => { e.target.select(); setFocused(r.id); }}
                  onChange={(e) => setValues((p) => ({ ...p, [r.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (document.querySelector(`input[data-row="${i + 1}"]`) as HTMLInputElement | null)?.focus();
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
        {dupes.size > 0 && <p className="text-sm text-destructive">The same ID is on more than one machine: {[...dupes].join(", ")}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !changed.length}>
            {saving ? "Saving..." : `Save ${changed.length || ""} change${changed.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
