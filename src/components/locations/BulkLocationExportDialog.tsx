import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocations } from "@/hooks/useLocationsDB";
import { useRoutes } from "@/hooks/useRoutesDB";
import { exportBulkLocationsCSV } from "@/utils/locationExport";
import { toast } from "@/hooks/use-toast";

export function BulkLocationExportDialog() {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("all");
  const { locations } = useLocations();
  const { routes } = useRoutes();

  const selected = useMemo(() => {
    if (scope === "all") return locations;
    if (scope === "active") return locations.filter((l) => l.isActive);
    const route = routes.find((r) => r.id === scope);
    if (!route) return [];
    const byId = new Map(locations.map((l) => [l.id, l]));
    const seen = new Set<string>();
    return [...route.stops]
      .sort((a, b) => a.stopOrder - b.stopOrder)
      .map((s) => (s.locationId ? byId.get(s.locationId) : undefined))
      .filter((l): l is NonNullable<typeof l> => !!l && !seen.has(l.id) && !!seen.add(l.id));
  }, [scope, locations, routes]);

  const machineTotal = selected.reduce((s, l) => s + (l.machineCount || 0), 0);
  const scopeName = scope === "all" ? "all" : scope === "active" ? "active" : routes.find((r) => r.id === scope)?.name || "route";

  const handleExport = () => {
    if (!selected.length) {
      toast({ title: "Nothing to export", description: "This selection has no locations." });
      return;
    }
    exportBulkLocationsCSV(selected, scopeName);
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4" /> Bulk export
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export locations</DialogTitle>
            <DialogDescription>
              One row per machine: location, address, contact, machine type, count and commission %.
            </DialogDescription>
          </DialogHeader>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="z-[100]">
              <SelectItem value="all">All locations</SelectItem>
              <SelectItem value="active">Active locations only</SelectItem>
              {routes.map((r) => (
                <SelectItem key={r.id} value={r.id}>Route: {r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {selected.length} locations · {machineTotal} machines
            {scope !== "all" && scope !== "active" ? " · in stop order" : ""}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleExport} className="gap-2"><Download className="h-4 w-4" /> Download CSV</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
