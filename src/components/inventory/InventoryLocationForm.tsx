import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryLocation, InventoryLocationInsert } from "@/hooks/useInventoryLocations";

interface InventoryLocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: InventoryLocation | null;
  onSave: (data: InventoryLocationInsert) => Promise<void>;
}

export function InventoryLocationForm({ open, onOpenChange, location, onSave }: InventoryLocationFormProps) {
  const [name, setName] = useState(location?.location_name || "");
  const [locType, setLocType] = useState<"warehouse" | "business_location">(location?.location_type || "warehouse");
  const [code, setCode] = useState(location?.code || "");
  const [address, setAddress] = useState(location?.address || "");
  const [notes, setNotes] = useState(location?.notes || "");
  const [active, setActive] = useState(location?.active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        location_name: name.trim(),
        location_type: locType,
        code: code.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        active,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{location ? "Edit Location" : "Add Location"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loc-name">Location Name *</Label>
            <Input id="loc-name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Main Warehouse" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Location Type *</Label>
              <Select value={locType} onValueChange={(v) => setLocType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="business_location">Business Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-code">Code</Label>
              <Input id="loc-code" value={code} onChange={e => setCode(e.target.value)} placeholder="WH-001" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc-address">Address</Label>
            <Input id="loc-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc-notes">Notes</Label>
            <Textarea id="loc-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="loc-active">Active</Label>
            <Switch id="loc-active" checked={active} onCheckedChange={setActive} />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !name.trim()}>{saving ? "Saving..." : location ? "Save Changes" : "Add Location"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
