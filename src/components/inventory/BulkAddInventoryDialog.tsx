import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface BulkAddRow {
  name: string;
  quantity: string;
  packageType: string;
  packageQuantity: string;
  costPerPackage: string;
}

const emptyRow = (): BulkAddRow => ({
  name: "",
  quantity: "",
  packageType: "Case",
  packageQuantity: "24",
  costPerPackage: "",
});

interface BulkAddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addItem: (item: {
    name: string;
    category: string;
    quantity: number;
    minStock: number;
    location: string;
    packageType: string;
    packageQuantity: number;
    supplierUrl: string | null;
    supplierName: string | null;
    lastPrice: number | null;
    pricePerItem: number | null;
    notes: string | null;
  }) => Promise<any>;
}

function getPricePerItem(row: BulkAddRow): number | null {
  const cost = parseFloat(row.costPerPackage);
  const pkgQty = parseInt(row.packageQuantity);
  if (!cost || !pkgQty || pkgQty === 0) return null;
  return cost / pkgQty;
}

function isRowFilled(row: BulkAddRow): boolean {
  return row.name.trim().length > 0 || row.quantity.length > 0;
}

function BulkAddTable({
  rows,
  setRows,
  isSubmitting,
  onSubmit,
}: {
  rows: BulkAddRow[];
  setRows: React.Dispatch<React.SetStateAction<BulkAddRow[]>>;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  const updateRow = (index: number, field: keyof BulkAddRow, value: string) => {
    setRows(prev => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);

  const validCount = rows.filter(r => r.name.trim() && (parseInt(r.quantity) || 0) > 0).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_70px_90px_60px_90px_60px_28px] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Name</span>
        <span>Qty</span>
        <span>Pkg Type</span>
        <span>Per Pkg</span>
        <span>Cost/Pkg</span>
        <span>/ea</span>
        <span />
      </div>

      {/* Rows */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {rows.map((row, i) => {
          const ppi = getPricePerItem(row);
          return (
            <div key={i} className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-[1fr_70px_90px_60px_90px_60px_28px] gap-2 items-center p-2 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none">
              {/* Mobile labels */}
              <div className="sm:hidden text-xs text-muted-foreground">Item {i + 1}</div>
              <Input
                placeholder="Item name"
                value={row.name}
                onChange={e => updateRow(i, "name", e.target.value)}
                className="h-9 text-sm"
              />
              <NumberInput
                placeholder="0"
                min="1"
                value={row.quantity}
                onChange={e => updateRow(i, "quantity", e.target.value)}
                className="h-9 text-sm text-center"
              />
              <Select value={row.packageType} onValueChange={v => updateRow(i, "packageType", v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Case">Case</SelectItem>
                  <SelectItem value="Bag">Bag</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Pack">Pack</SelectItem>
                </SelectContent>
              </Select>
              <NumberInput
                placeholder="24"
                min="1"
                value={row.packageQuantity}
                onChange={e => updateRow(i, "packageQuantity", e.target.value)}
                className="h-9 text-sm text-center"
              />
              <NumberInput
                placeholder="0.00"
                min="0"
                step="0.01"
                value={row.costPerPackage}
                onChange={e => updateRow(i, "costPerPackage", e.target.value)}
                className="h-9 text-sm text-center"
              />
              <span className="text-xs text-muted-foreground text-center tabular-nums">
                {ppi !== null ? `$${ppi.toFixed(2)}` : "—"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      <Button variant="outline" size="sm" onClick={addRow} className="w-full">
        <Plus className="h-4 w-4 mr-1" />
        Add Row
      </Button>

      <Button
        onClick={onSubmit}
        disabled={isSubmitting || validCount === 0}
        className="w-full h-12 text-base font-semibold"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <Plus className="h-5 w-5 mr-2" />
        )}
        {validCount > 0 ? `Add ${validCount} Item${validCount !== 1 ? "s" : ""}` : "Add Items"}
      </Button>
    </div>
  );
}

export function BulkAddInventoryDialog({ open, onOpenChange, addItem }: BulkAddInventoryDialogProps) {
  const isMobile = useIsMobile();
  const { settings: appSettings } = useAppSettings();
  const [rows, setRows] = useState<BulkAddRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validRows = rows.filter(r => r.name.trim() && (parseInt(r.quantity) || 0) > 0);
    if (validRows.length === 0) return;

    setIsSubmitting(true);
    let added = 0;
    for (const row of validRows) {
      const pkgQty = parseInt(row.packageQuantity) || 24;
      const cost = parseFloat(row.costPerPackage) || null;
      const result = await addItem({
        name: row.name.trim(),
        category: "General",
        quantity: parseInt(row.quantity) || 0,
        minStock: appSettings.lowStockThreshold,
        location: "",
        packageType: row.packageType,
        packageQuantity: pkgQty,
        supplierUrl: null,
        supplierName: null,
        lastPrice: cost,
        pricePerItem: cost && pkgQty ? cost / pkgQty : null,
        notes: null,
      });
      if (result) added++;
    }
    setIsSubmitting(false);

    if (added > 0) {
      toast({ title: "Bulk Add Complete!", description: `${added} item${added !== 1 ? "s" : ""} added to inventory.` });
      setRows([emptyRow(), emptyRow(), emptyRow()]);
      onOpenChange(false);
    }
  };

  const content = (
    <BulkAddTable rows={rows} setRows={setRows} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bulk Add Items</SheetTitle>
            <SheetDescription>Add multiple inventory items at once</SheetDescription>
          </SheetHeader>
          <div className="py-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk Add Items</DialogTitle>
          <DialogDescription>Add multiple inventory items at once</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
