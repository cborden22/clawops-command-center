import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Warehouse, Plus, Trash2, ChevronDown, ChevronUp, Star, Package, Edit2 } from "lucide-react";
import { useWarehouses, type Warehouse as WarehouseType, type WarehouseZone } from "@/hooks/useWarehousesDB";
import { toast } from "@/hooks/use-toast";

const ZONE_TYPE_LABELS: Record<WarehouseZone["zoneType"], string> = {
  tote: "Tote",
  shelf: "Shelf",
  bin: "Bin",
  section: "Section",
  other: "Other",
};

export function WarehouseManager() {
  const {
    warehouses,
    isLoaded,
    getZonesForWarehouse,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    addZone,
    deleteZone,
  } = useWarehouses();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddZoneFor, setShowAddZoneFor] = useState<string | null>(null);

  // Add warehouse form
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newZip, setNewZip] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);

  // Add zone form
  const [zoneName, setZoneName] = useState("");
  const [zoneType, setZoneType] = useState<WarehouseZone["zoneType"]>("tote");

  const resetWarehouseForm = () => {
    setNewName("");
    setNewAddress("");
    setNewCity("");
    setNewState("");
    setNewZip("");
    setNewIsDefault(false);
  };

  const handleAddWarehouse = async () => {
    if (!newName.trim()) return;
    const result = await addWarehouse({
      name: newName.trim(),
      address: newAddress || undefined,
      city: newCity || undefined,
      state: newState || undefined,
      zip: newZip || undefined,
      isDefault: newIsDefault || warehouses.length === 0,
    });
    if (result) {
      toast({ title: "Warehouse Added", description: `${newName} has been created.` });
      resetWarehouseForm();
      setShowAddDialog(false);
    }
  };

  const handleAddZone = async () => {
    if (!showAddZoneFor || !zoneName.trim()) return;
    const result = await addZone(showAddZoneFor, { name: zoneName.trim(), zoneType: zoneType });
    if (result) {
      toast({ title: "Zone Added", description: `${zoneName} has been created.` });
      setZoneName("");
      setZoneType("tote");
      setShowAddZoneFor(null);
    }
  };

  const handleSetDefault = async (wh: WarehouseType) => {
    if (wh.isDefault) return;
    await updateWarehouse(wh.id, { isDefault: true });
    toast({ title: "Default Updated", description: `${wh.name} is now the default warehouse.` });
  };

  const handleDelete = async (wh: WarehouseType) => {
    await deleteWarehouse(wh.id);
    toast({ title: "Deleted", description: `${wh.name} has been removed.` });
  };

  if (!isLoaded) return null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-primary" />
              Warehouses & Storage
            </CardTitle>
            <CardDescription>
              Manage your warehouses and storage zones (totes, shelves, bins)
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {warehouses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No warehouses yet. Add your first warehouse to organize inventory storage.
          </p>
        )}

        {warehouses.map((wh) => {
          const whZones = getZonesForWarehouse(wh.id);
          const isExpanded = expandedId === wh.id;

          return (
            <Collapsible key={wh.id} open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : wh.id)}>
              <div className="border rounded-lg p-3">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2 min-w-0">
                      <Warehouse className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{wh.name}</span>
                      {wh.isDefault && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          <Star className="h-3 w-3 mr-1" /> Default
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs shrink-0">
                        {whZones.length} zone{whZones.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-3 space-y-3">
                  {wh.address && (
                    <p className="text-sm text-muted-foreground">
                      {[wh.address, wh.city, wh.state, wh.zip].filter(Boolean).join(", ")}
                    </p>
                  )}

                  {/* Zones list */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Storage Zones</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowAddZoneFor(wh.id); setZoneName(""); setZoneType("tote"); }}>
                        <Plus className="h-3 w-3 mr-1" /> Add Zone
                      </Button>
                    </div>
                    {whZones.length === 0 && (
                      <p className="text-xs text-muted-foreground pl-2">No zones yet</p>
                    )}
                    {whZones.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between bg-muted/50 rounded px-2.5 py-1.5">
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{zone.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">{zone.zoneType}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteZone(zone.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {!wh.isDefault && (
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => handleSetDefault(wh)}>
                        <Star className="h-3 w-3 mr-1" /> Set Default
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(wh)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>

      {/* Add Warehouse Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Warehouse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Main Storage" />
            </div>
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={newState} onChange={(e) => setNewState(e.target.value)} placeholder="State" />
              </div>
              <div className="space-y-2">
                <Label>ZIP</Label>
                <Input value={newZip} onChange={(e) => setNewZip(e.target.value)} placeholder="12345" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddWarehouse} disabled={!newName.trim()}>Add Warehouse</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Zone Dialog */}
      <Dialog open={!!showAddZoneFor} onOpenChange={() => setShowAddZoneFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Storage Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Zone Name *</Label>
              <Input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="e.g., Tote A (Red)" />
            </div>
            <div className="space-y-2">
              <Label>Zone Type</Label>
              <Select value={zoneType} onValueChange={(v) => setZoneType(v as WarehouseZone["zoneType"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ZONE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddZoneFor(null)}>Cancel</Button>
            <Button onClick={handleAddZone} disabled={!zoneName.trim()}>Add Zone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
