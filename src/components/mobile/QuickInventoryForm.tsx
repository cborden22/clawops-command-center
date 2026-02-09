import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventory } from "@/hooks/useInventoryDB";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Minus, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface QuickInventoryFormProps {
  onSuccess: () => void;
}

export function QuickInventoryForm({ onSuccess }: QuickInventoryFormProps) {
  const { items, updateQuantity, addItem } = useInventory();
  const { settings: appSettings } = useAppSettings();
  const [mode, setMode] = useState<"adjust" | "add">("adjust");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("remove");
  const [quantity, setQuantity] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("10");
  const [newPackageType, setNewPackageType] = useState("Case");
  const [newPackageQty, setNewPackageQty] = useState("24");
  const [newCostPerPkg, setNewCostPerPkg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleAdjust = async () => {
    if (!selectedItemId || !quantity || parseInt(quantity) <= 0) {
      toast({ title: "Invalid input", description: "Select an item and enter quantity.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const change = adjustmentType === "add" ? parseInt(quantity) : -parseInt(quantity);
      await updateQuantity(selectedItemId, change);
      toast({
        title: "Stock updated!",
        description: `${adjustmentType === "add" ? "Added" : "Removed"} ${quantity} from ${selectedItem?.name}.`,
      });
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update stock.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNew = async () => {
    if (!newItemName.trim()) {
      toast({ title: "Enter name", description: "Please enter an item name.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const pkgQty = parseInt(newPackageQty) || 24;
      const cost = newCostPerPkg ? parseFloat(newCostPerPkg) : null;
      await addItem({
        name: newItemName.trim(),
        category: "General",
        quantity: parseInt(newItemQty) || 10,
        minStock: appSettings.lowStockThreshold,
        location: "",
        packageType: newPackageType,
        packageQuantity: pkgQty,
        supplierUrl: null,
        supplierName: null,
        lastPrice: cost,
        pricePerItem: cost && pkgQty ? cost / pkgQty : null,
        notes: null,
      });
      toast({ title: "Item added!", description: `${newItemName} added to inventory.` });
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "adjust" ? "default" : "outline"}
          className="flex-1 h-12"
          onClick={() => setMode("adjust")}
        >
          <Package className="h-4 w-4 mr-2" />
          Adjust Stock
        </Button>
        <Button
          variant={mode === "add" ? "default" : "outline"}
          className="flex-1 h-12"
          onClick={() => setMode("add")}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Item
        </Button>
      </div>

      {mode === "adjust" ? (
        <>
          {/* Select Item */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Item</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select item to adjust" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.quantity} in stock)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add/Remove Toggle */}
          <div className="flex gap-2">
            <Button
              variant={adjustmentType === "remove" ? "default" : "outline"}
              className={cn(
                "flex-1 h-12",
                adjustmentType === "remove" && "bg-destructive hover:bg-destructive/90"
              )}
              onClick={() => setAdjustmentType("remove")}
            >
              <Minus className="h-4 w-4 mr-2" />
              Remove
            </Button>
            <Button
              variant={adjustmentType === "add" ? "default" : "outline"}
              className={cn(
                "flex-1 h-12",
                adjustmentType === "add" && "bg-emerald-600 hover:bg-emerald-700"
              )}
              onClick={() => setAdjustmentType("add")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quantity</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-14 text-2xl font-semibold text-center"
              onFocus={(e) => e.target.select()}
            />
          </div>

          {selectedItem && quantity && (
            <p className="text-sm text-muted-foreground text-center">
              New stock: {selectedItem.quantity + (adjustmentType === "add" ? parseInt(quantity) || 0 : -(parseInt(quantity) || 0))}
            </p>
          )}

          <Button
            onClick={handleAdjust}
            disabled={isSubmitting || !selectedItemId || !quantity}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Stock"}
          </Button>
        </>
      ) : (
        <>
          {/* New Item Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Item Name</Label>
            <Input
              placeholder="e.g., Plush Bears"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Total Individual Items */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Total Individual Items</Label>
            <p className="text-xs text-muted-foreground -mt-1">How many individual pieces you have in total</p>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="10"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              className="h-14 text-2xl font-semibold text-center"
              onFocus={(e) => e.target.select()}
            />
          </div>

          {/* Packaging */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Packaging</Label>
            <div className="flex gap-2 items-center">
              <Select value={newPackageType} onValueChange={setNewPackageType}>
                <SelectTrigger className="flex-1 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Case">Case</SelectItem>
                  <SelectItem value="Bag">Bag</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Pack">Pack</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">of</span>
              <Input
                type="number"
                inputMode="numeric"
                value={newPackageQty}
                onChange={(e) => setNewPackageQty(e.target.value)}
                className="w-20 h-12 text-center"
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>

          {/* Cost per Package */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cost per {newPackageType}</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={newCostPerPkg}
              onChange={(e) => setNewCostPerPkg(e.target.value)}
              className="h-12"
              onFocus={(e) => e.target.select()}
            />
            {newCostPerPkg && parseFloat(newCostPerPkg) > 0 && parseInt(newPackageQty) > 0 && (
              <p className="text-xs text-muted-foreground">
                = ${(parseFloat(newCostPerPkg) / parseInt(newPackageQty)).toFixed(2)}/ea
              </p>
            )}
          </div>

          <Button
            onClick={handleAddNew}
            disabled={isSubmitting || !newItemName.trim()}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add Item"}
          </Button>
        </>
      )}
    </div>
  );
}
