import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem } from "@/hooks/useInventoryDB";

const CATEGORIES = ["Plush", "Parts", "Machines", "Bulk"];

interface InventoryItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSave: (data: Partial<InventoryItem>) => Promise<void>;
}

export function InventoryItemForm({ open, onOpenChange, item, onSave }: InventoryItemFormProps) {
  const [name, setName] = useState(item?.name || "");
  const [sku, setSku] = useState(item?.sku || "");
  const [category, setCategory] = useState(item?.category || "Plush");
  const [subcategory, setSubcategory] = useState(item?.subcategory || "");
  const [unitCost, setUnitCost] = useState(item?.pricePerItem?.toString() || "");
  const [description, setDescription] = useState(item?.description || "");
  const [lowStockThreshold, setLowStockThreshold] = useState(item?.minStock?.toString() || "");
  const [active, setActive] = useState(item?.active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        sku: sku.trim() || null,
        category,
        subcategory: subcategory.trim() || null,
        pricePerItem: unitCost ? parseFloat(unitCost) : null,
        description: description.trim() || null,
        minStock: lowStockThreshold ? parseInt(lowStockThreshold) : 0,
        active,
        notes: item?.notes ?? null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add Inventory Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Item Name *</Label>
            <Input id="item-name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. 6-inch Plush Bear" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-sku">SKU</Label>
              <Input id="item-sku" value={sku} onChange={e => setSku(e.target.value)} placeholder="PL-6-BEAR" />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-sub">Subcategory</Label>
            <Input id="item-sub" value={subcategory} onChange={e => setSubcategory(e.target.value)} placeholder="e.g. 6-inch plush" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="unit-cost">Unit Cost ($)</Label>
              <Input id="unit-cost" type="number" step="0.01" min="0" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="1.25" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="low-stock">Low Stock Threshold</Label>
              <Input id="low-stock" type="number" min="0" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} placeholder="50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-desc">Description</Label>
            <Textarea id="item-desc" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description..." />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="item-active">Active</Label>
            <Switch id="item-active" checked={active} onCheckedChange={setActive} />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !name.trim() || !category}>{saving ? "Saving..." : item ? "Save Changes" : "Add Item"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
