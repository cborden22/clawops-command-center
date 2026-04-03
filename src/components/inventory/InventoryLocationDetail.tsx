import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InventoryLocation } from "@/hooks/useInventoryLocations";
import { InventoryBalance } from "@/hooks/useInventoryBalances";
import { useInventory } from "@/hooks/useInventoryDB";
import { Pencil, Trash2, Save, X, MapPin, Warehouse } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface InventoryLocationDetailProps {
  location: InventoryLocation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances: InventoryBalance[];
  onUpdateBalance: (id: string, updates: { quantity_on_hand?: number; reorder_point?: number | null }) => Promise<boolean>;
  onDeleteBalance: (id: string) => Promise<boolean>;
  onEditLocation: () => void;
  onDeleteLocation: () => Promise<void>;
}

export function InventoryLocationDetail({
  location, open, onOpenChange, balances,
  onUpdateBalance, onDeleteBalance, onEditLocation, onDeleteLocation
}: InventoryLocationDetailProps) {
  const { items } = useInventory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("0");
  const [saving, setSaving] = useState(false);

  const getItem = (itemId: string) => items.find(i => i.id === itemId);

  const totalUnits = balances.reduce((sum, b) => sum + b.quantity_on_hand, 0);
  const totalValue = balances.reduce((sum, b) => {
    const item = getItem(b.inventory_item_id);
    return sum + (b.quantity_on_hand * (item?.pricePerItem || 0));
  }, 0);

  const handleSaveEdit = async (balanceId: string) => {
    setSaving(true);
    await onUpdateBalance(balanceId, { quantity_on_hand: parseInt(editQty) || 0 });
    setEditingId(null);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {location.location_type === "warehouse" ? <Warehouse className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
            {location.location_name}
            {!location.active && <Badge variant="outline">Inactive</Badge>}
          </DialogTitle>
          <DialogDescription>Location inventory details</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Code</span>
            <p className="font-medium">{location.code || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Type</span>
            <p className="font-medium">{location.location_type === "warehouse" ? "Warehouse" : "Business Location"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Address</span>
            <p className="font-medium">{location.address || "—"}</p>
          </div>
        </div>

        {location.notes && <p className="text-sm text-muted-foreground">{location.notes}</p>}

        <Separator />

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Units</p>
              <p className="text-xl font-bold">{totalUnits.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Est. Value</p>
              <p className="text-xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Value</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                    No inventory at this location.
                  </TableCell>
                </TableRow>
              ) : (
                balances.map(balance => {
                  const item = getItem(balance.inventory_item_id);
                  const rowValue = balance.quantity_on_hand * (item?.pricePerItem || 0);
                  return (
                    <TableRow key={balance.id}>
                      <TableCell className="font-medium">{item?.name || "Unknown"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">{item?.category || "—"}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{item?.sku || "—"}</TableCell>
                      <TableCell className="text-right">
                        {editingId === balance.id ? (
                          <Input type="number" min="0" value={editQty} onChange={e => setEditQty(e.target.value)} className="w-20 ml-auto" />
                        ) : (
                          <span className="tabular-nums font-medium">{balance.quantity_on_hand.toLocaleString()}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell tabular-nums">
                        ${rowValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {editingId === balance.id ? (
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveEdit(balance.id)} disabled={saving}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                              setEditingId(balance.id);
                              setEditQty(balance.quantity_on_hand.toString());
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Separator />

        <div className="flex gap-2 justify-between">
          <Button variant="destructive" size="sm" onClick={onDeleteLocation}>Delete Location</Button>
          <Button variant="outline" size="sm" onClick={onEditLocation}>
            <Pencil className="h-3 w-3 mr-1" /> Edit Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
