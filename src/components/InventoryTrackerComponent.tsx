import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package, AlertTriangle, Minus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useInventory } from "@/hooks/useInventoryDB";

export function InventoryTrackerComponent() {
  const { items, isLoaded, addItem, deleteItem, updateQuantity } = useInventory();
  const [searchQuery, setSearchQuery] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(10);

  const handleQuickAdd = async () => {
    if (!newItemName.trim()) {
      toast({
        title: "Enter a name",
        description: "Please enter an item name.",
        variant: "destructive",
      });
      return;
    }

    const item = await addItem({
      name: newItemName.trim(),
      category: "General",
      quantity: newItemQty,
      minStock: 5,
      location: "",
    });

    if (item) {
      setNewItemName("");
      setNewItemQty(10);
      toast({
        title: "Added!",
        description: `${item.name} added to inventory.`,
      });
    }
  };

  const handleUpdateQuantity = async (id: string, change: number) => {
    await updateQuantity(id, change);
  };

  const handleSetQuantity = async (id: string, newQty: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const change = newQty - item.quantity;
      await updateQuantity(id, change);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    await deleteItem(id);
    toast({
      title: "Removed",
      description: `${item?.name || "Item"} removed.`,
    });
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = items.filter((item) => item.quantity <= item.minStock);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!isLoaded) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Stock</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </div>
        </Card>

        <Card className={cn("p-4", lowStockItems.length > 0 && "border-destructive/30")}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              lowStockItems.length > 0 ? "bg-destructive/10" : "bg-muted"
            )}>
              <AlertTriangle className={cn(
                "h-5 w-5",
                lowStockItems.length > 0 ? "text-destructive" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low Stock</p>
              <p className={cn(
                "text-2xl font-bold",
                lowStockItems.length > 0 && "text-destructive"
              )}>{lowStockItems.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Add */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Item name..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
            className="flex-1"
          />
          <Input
            type="number"
            min="1"
            value={newItemQty}
            onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
            className="w-20 text-center"
          />
          <Button onClick={handleQuickAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </Card>

      {/* Search */}
      {items.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No items yet</p>
          <p className="text-sm text-muted-foreground/70">Add your first item above</p>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 text-center">
          <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground">No matching items</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "p-3 transition-colors",
                item.quantity <= item.minStock && "border-destructive/30 bg-destructive/5"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Name & Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{item.name}</span>
                    {item.quantity <= item.minStock && (
                      <Badge variant="destructive" className="text-xs shrink-0">
                        Low
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <Input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => handleSetQuantity(item.id, parseInt(e.target.value) || 0)}
                    className={cn(
                      "w-16 h-8 text-center font-bold",
                      item.quantity <= item.minStock && "text-destructive"
                    )}
                  />
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteItem(item.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Low Stock Summary */}
      {lowStockItems.length > 0 && (
        <Card className="p-4 border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-medium text-destructive text-sm">Needs Restocking</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <Badge key={item.id} variant="outline" className="border-destructive/30">
                {item.name}: {item.quantity}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}