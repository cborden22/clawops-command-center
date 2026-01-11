import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package, AlertTriangle, Minus, Search, ShoppingCart, X, Check, Edit2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useInventory, InventoryItem } from "@/hooks/useInventoryDB";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  available: number;
}

export function InventoryTrackerComponent() {
  const { items, isLoaded, addItem, updateItem, deleteItem, updateQuantity, bulkDeductQuantities } = useInventory();
  const [searchQuery, setSearchQuery] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemPackageType, setNewItemPackageType] = useState("Case");
  const [newItemPackageQty, setNewItemPackageQty] = useState(24);
  
  // Stock Run state
  const [isStockRunMode, setIsStockRunMode] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  
  // Custom quantity input state
  const [customQtyItemId, setCustomQtyItemId] = useState<string | null>(null);
  const [customQtyValue, setCustomQtyValue] = useState("");
  
  // Edit item dialog state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editPackageType, setEditPackageType] = useState("");
  const [editPackageQty, setEditPackageQty] = useState(24);

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
      packageType: newItemPackageType,
      packageQuantity: newItemPackageQty,
    });

    if (item) {
      setNewItemName("");
      setNewItemQty(10);
      setNewItemPackageType("Case");
      setNewItemPackageQty(24);
      toast({
        title: "Added!",
        description: `${item.name} added to inventory.`,
      });
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setEditPackageType(item.packageType);
    setEditPackageQty(item.packageQuantity);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    await updateItem(editingItem.id, {
      packageType: editPackageType,
      packageQuantity: editPackageQty,
    });
    setEditingItem(null);
    toast({
      title: "Updated!",
      description: `${editingItem.name} packaging updated.`,
    });
  };

  const handleCustomQtyAdd = (itemId: string) => {
    const qty = parseInt(customQtyValue);
    if (qty > 0) {
      addToCart(itemId, qty);
      setCustomQtyItemId(null);
      setCustomQtyValue("");
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

  // Stock Run functions
  const addToCart = (itemId: string, qty: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, item.quantity);
        return prev.map(c => c.id === itemId ? { ...c, quantity: newQty } : c);
      }
      return [...prev, { id: itemId, name: item.name, quantity: Math.min(qty, item.quantity), available: item.quantity }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, newQty: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    if (newQty <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(prev => prev.map(c => 
        c.id === itemId ? { ...c, quantity: Math.min(newQty, item.quantity) } : c
      ));
    }
  };

  const getCartQuantity = (itemId: string) => {
    return cart.find(c => c.id === itemId)?.quantity || 0;
  };

  const totalCartItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleConfirmStockRun = async () => {
    if (cart.length === 0) return;

    const success = await bulkDeductQuantities(cart.map(c => ({ id: c.id, quantity: c.quantity })));
    
    if (success) {
      toast({
        title: "Stock Run Complete!",
        description: `${totalCartItems} items deducted from ${cart.length} products.`,
      });
      setCart([]);
      setShowConfirmSheet(false);
      setIsStockRunMode(false);
    }
  };

  const cancelStockRun = () => {
    setCart([]);
    setIsStockRunMode(false);
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
    <div className="space-y-4 animate-fade-in pb-24">
      {/* Stock Run Toggle */}
      <div className="flex gap-2">
        {!isStockRunMode ? (
          <Button 
            onClick={() => setIsStockRunMode(true)} 
            className="flex-1"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Start Stock Run
          </Button>
        ) : (
          <Button 
            onClick={cancelStockRun} 
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel Stock Run
          </Button>
        )}
      </div>

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

      {/* Quick Add - Only show when not in stock run mode */}
      {!isStockRunMode && (
        <Card className="p-4 space-y-3">
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
          {/* Packaging Configuration */}
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Packaging:</span>
            <Select value={newItemPackageType} onValueChange={setNewItemPackageType}>
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Case">Case</SelectItem>
                <SelectItem value="Bag">Bag</SelectItem>
                <SelectItem value="Box">Box</SelectItem>
                <SelectItem value="Pack">Pack</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">of</span>
            <Input
              type="number"
              min="1"
              value={newItemPackageQty}
              onChange={(e) => setNewItemPackageQty(parseInt(e.target.value) || 1)}
              className="w-16 h-8 text-center text-sm"
            />
          </div>
        </Card>
      )}

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
          {filteredItems.map((item) => {
            const cartQty = getCartQuantity(item.id);
            const isInCart = cartQty > 0;
            
            return (
              <Card
                key={item.id}
                className={cn(
                  "p-3 transition-colors",
                  item.quantity <= item.minStock && "border-destructive/30 bg-destructive/5",
                  isStockRunMode && isInCart && "border-primary bg-primary/5"
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
                      {isStockRunMode && isInCart && (
                        <Badge className="text-xs shrink-0">
                          {cartQty} in cart
                        </Badge>
                      )}
                      {!isStockRunMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {isStockRunMode ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.quantity} available
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.packageType} of {item.packageQuantity}
                      </p>
                    )}
                  </div>

                  {/* Stock Run Mode Controls */}
                  {isStockRunMode ? (
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {customQtyItemId === item.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            value={customQtyValue}
                            onChange={(e) => setCustomQtyValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCustomQtyAdd(item.id)}
                            className="w-16 h-8 text-center"
                            autoFocus
                          />
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleCustomQtyAdd(item.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => { setCustomQtyItemId(null); setCustomQtyValue(""); }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => addToCart(item.id, 5)}
                            disabled={item.quantity === 0}
                          >
                            +5
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => addToCart(item.id, 10)}
                            disabled={item.quantity === 0}
                          >
                            +10
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => addToCart(item.id, 20)}
                            disabled={item.quantity === 0}
                          >
                            +20
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => addToCart(item.id, item.packageQuantity)}
                            disabled={item.quantity === 0}
                          >
                            +{item.packageQuantity} {item.packageType}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setCustomQtyItemId(item.id)}
                            disabled={item.quantity === 0}
                          >
                            Cust
                          </Button>
                          {isInCart && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Normal Mode Controls */}
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
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Low Stock Summary - Only show when not in stock run mode */}
      {!isStockRunMode && lowStockItems.length > 0 && (
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

      {/* Floating Cart Summary */}
      {isStockRunMode && cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Card className="p-4 bg-primary text-primary-foreground shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5" />
                <div>
                  <p className="font-semibold">{cart.length} items</p>
                  <p className="text-sm opacity-90">{totalCartItems} pieces total</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => setShowConfirmSheet(true)}
              >
                <Check className="h-4 w-4 mr-2" />
                Review
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Sheet */}
      <Sheet open={showConfirmSheet} onOpenChange={setShowConfirmSheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Confirm Stock Run</SheetTitle>
            <SheetDescription>
              Review items to deduct from inventory
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-4 space-y-3 overflow-y-auto max-h-[calc(80vh-180px)]">
            {cart.map((cartItem) => (
              <Card key={cartItem.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{cartItem.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cartItem.available} in stock
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCartQuantity(cartItem.id, cartItem.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={cartItem.available}
                      value={cartItem.quantity}
                      onChange={(e) => updateCartQuantity(cartItem.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center font-bold"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCartQuantity(cartItem.id, cartItem.quantity + 1)}
                      disabled={cartItem.quantity >= cartItem.available}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(cartItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <SheetFooter className="flex-col gap-2 sm:flex-col">
            <div className="text-center py-2">
              <p className="text-lg font-bold">{totalCartItems} total pieces</p>
              <p className="text-sm text-muted-foreground">from {cart.length} products</p>
            </div>
            <Button 
              onClick={handleConfirmStockRun} 
              className="w-full" 
              size="lg"
              disabled={cart.length === 0}
            >
              <Check className="h-5 w-5 mr-2" />
              Confirm Stock Run
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Package Type</label>
              <Select value={editPackageType} onValueChange={setEditPackageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Case">Case</SelectItem>
                  <SelectItem value="Bag">Bag</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Package Quantity</label>
              <Input
                type="number"
                min="1"
                value={editPackageQty}
                onChange={(e) => setEditPackageQty(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Items per {editPackageType.toLowerCase()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
