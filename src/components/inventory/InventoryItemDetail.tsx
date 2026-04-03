import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem } from "@/hooks/useInventoryDB";
import { InventoryBalance } from "@/hooks/useInventoryBalances";
import { InventoryLocation } from "@/hooks/useInventoryLocations";
import { Plus, Pencil, Trash2, MapPin, Save, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface InventoryItemDetailProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances: InventoryBalance[];
  locations: InventoryLocation[];
  onAddBalance: (itemId: string, locationId: string, qty: number, reorderPoint?: number | null, notes?: string | null) => Promise<any>;
  onUpdateBalance: (id: string, updates: { quantity_on_hand?: number; reorder_point?: number | null; notes?: string | null }) => Promise<boolean>;
  onDeleteBalance: (id: string) => Promise<boolean>;
  onEditItem: () => void;
  onDeleteItem: () => Promise<void>;
}

export function InventoryItemDetail({
  item, open, onOpenChange, balances, locations,
  onAddBalance, onUpdateBalance, onDeleteBalance, onEditItem, onDeleteItem
}: InventoryItemDetailProps) {
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationId, setNewLocationId] = useState("");
  const [newQty, setNewQty] = useState("0");
  const [newReorder, setNewReorder] = useState("");
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("0");
  const [editReorder, setEditReorder] = useState("");
  const [saving, setSaving] = useState(false);

  const totalQty = balances.reduce((sum, b) => sum + b.quantity_on_hand, 0);
  const assignedLocationIds = new Set(balances.map(b => b.location_id));
  const availableLocations = locations.filter(l => l.active && !assignedLocationIds.has(l.id));

  const getLocationName = (id: string) => locations.find(l => l.id === id)?.location_name || "Unknown";
  const getLocationType = (id: string) => {
    const loc = locations.find(l => l.id === id);
    return loc?.location_type === "warehouse" ? "Warehouse" : "Business Location";
  };

  const handleAddBalance = async () => {
    if (!newLocationId) return;
    setSaving(true);
    await onAddBalance(item.id, newLocationId, parseInt(newQty) || 0, newReorder ? parseInt(newReorder) : null);
    setShowAddLocation(false);
    setNewLocationId("");
    setNewQty("0");
    setNewReorder("");
    setSaving(false);
  };

  const handleSaveEdit = async (balanceId: string) => {
    setSaving(true);
    await onUpdateBalance(balanceId, {
      quantity_on_hand: parseInt(editQty) || 0,
      reorder_point: editReorder ? parseInt(editReorder) : null,
    });
    setEditingBalanceId(null);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.name}
            {!item.active && <Badge variant="outline">Inactive</Badge>}
          </DialogTitle>
          <DialogDescription>Item details and inventory by location</DialogDescription>
        </DialogHeader>

        {/* Item Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">SKU</span>
            <p className="font-medium">{item.sku || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Category</span>
            <p className="font-medium">{item.category || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Subcategory</span>
            <p className="font-medium">{item.subcategory || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Unit Cost</span>
            <p className="font-medium">{item.pricePerItem ? `$${item.pricePerItem.toFixed(2)}` : "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Low Stock Threshold</span>
            <p className="font-medium">{item.minStock || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total Qty</span>
            <p className="font-medium text-lg">{totalQty.toLocaleString()}</p>
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}

        <Separator />

        {/* Quantities by Location */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> Quantities by Location
            </h3>
            <Button size="sm" variant="outline" onClick={() => setShowAddLocation(true)} disabled={availableLocations.length === 0} className="gap-1">
              <Plus className="h-3 w-3" /> Add Location
            </Button>
          </div>

          {/* Add location row */}
          {showAddLocation && (
            <div className="flex flex-col sm:flex-row gap-2 p-3 bg-muted/50 rounded-lg">
              <Select value={newLocationId} onValueChange={setNewLocationId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select location..." /></SelectTrigger>
                <SelectContent>
                  {availableLocations.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.location_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" min="0" value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="Qty" className="w-24" />
              <Input type="number" min="0" value={newReorder} onChange={e => setNewReorder(e.target.value)} placeholder="Reorder pt" className="w-28" />
              <div className="flex gap-1">
                <Button size="sm" onClick={handleAddBalance} disabled={!newLocationId || saving}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddLocation(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty On Hand</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Reorder Pt</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      No locations assigned. Add this item to a location above.
                    </TableCell>
                  </TableRow>
                ) : (
                  balances.map(balance => (
                    <TableRow key={balance.id}>
                      <TableCell className="font-medium">{getLocationName(balance.location_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{getLocationType(balance.location_id)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingBalanceId === balance.id ? (
                          <Input type="number" min="0" value={editQty} onChange={e => setEditQty(e.target.value)} className="w-20 ml-auto" />
                        ) : (
                          <span className="tabular-nums font-medium">{balance.quantity_on_hand.toLocaleString()}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {editingBalanceId === balance.id ? (
                          <Input type="number" min="0" value={editReorder} onChange={e => setEditReorder(e.target.value)} className="w-20 ml-auto" />
                        ) : (
                          <span className="tabular-nums">{balance.reorder_point ?? "—"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingBalanceId === balance.id ? (
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveEdit(balance.id)} disabled={saving}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingBalanceId(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                              setEditingBalanceId(balance.id);
                              setEditQty(balance.quantity_on_hand.toString());
                              setEditReorder(balance.reorder_point?.toString() || "");
                            }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDeleteBalance(balance.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator />

        <div className="flex gap-2 justify-between">
          <Button variant="destructive" size="sm" onClick={onDeleteItem}>Delete Item</Button>
          <Button variant="outline" size="sm" onClick={onEditItem}>
            <Pencil className="h-3 w-3 mr-1" /> Edit Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
