import { useState } from "react";
import { useInventoryLocations, InventoryLocation } from "@/hooks/useInventoryLocations";
import { useInventoryBalances } from "@/hooks/useInventoryBalances";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, MapPin, Warehouse } from "lucide-react";
import { InventoryLocationForm } from "./InventoryLocationForm";
import { InventoryLocationDetail } from "./InventoryLocationDetail";

export function InventoryLocationsList() {
  const { locations, addLocation, updateLocation, deleteLocation } = useInventoryLocations();
  const { balances, getBalancesForLocation, updateBalance, deleteBalance } = useInventoryBalances();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "warehouse" | "business_location">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<InventoryLocation | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<InventoryLocation | null>(null);

  const filtered = locations.filter(l => {
    const matchesSearch = !search || l.location_name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || l.location_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search locations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="warehouse">Warehouse</SelectItem>
            <SelectItem value="business_location">Business Location</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditingLocation(null); setShowAddForm(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location Name</TableHead>
                <TableHead className="hidden sm:table-cell">Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {locations.length === 0 ? "No locations yet. Add your first location!" : "No locations match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(loc => {
                  const itemCount = getBalancesForLocation(loc.id).filter(b => b.quantity_on_hand > 0).length;
                  return (
                    <TableRow key={loc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLocation(loc)}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {loc.location_type === "warehouse" ? <Warehouse className="h-4 w-4 text-muted-foreground" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
                        {loc.location_name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{loc.code || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {loc.location_type === "warehouse" ? "Warehouse" : "Business"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{loc.address || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{itemCount}</TableCell>
                      <TableCell>
                        <Badge variant={loc.active ? "outline" : "secondary"} className="text-xs">
                          {loc.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showAddForm && (
        <InventoryLocationForm
          open={showAddForm}
          onOpenChange={setShowAddForm}
          location={editingLocation}
          onSave={async (data) => {
            if (editingLocation) {
              await updateLocation(editingLocation.id, data);
            } else {
              await addLocation(data as any);
            }
            setShowAddForm(false);
            setEditingLocation(null);
          }}
        />
      )}

      {selectedLocation && (
        <InventoryLocationDetail
          location={selectedLocation}
          open={!!selectedLocation}
          onOpenChange={(open) => { if (!open) setSelectedLocation(null); }}
          balances={getBalancesForLocation(selectedLocation.id)}
          onUpdateBalance={updateBalance}
          onDeleteBalance={deleteBalance}
          onEditLocation={() => { setEditingLocation(selectedLocation); setShowAddForm(true); setSelectedLocation(null); }}
          onDeleteLocation={async () => { await deleteLocation(selectedLocation.id); setSelectedLocation(null); }}
        />
      )}
    </div>
  );
}
