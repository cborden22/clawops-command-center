import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package, AlertTriangle, Minus, Search, ShoppingCart, X, Check, Edit2, RotateCcw, ExternalLink, ChevronDown, ChevronUp, DollarSign, CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useInventory, InventoryItem, saveStockRunHistory, updateStockRunReturns } from "@/hooks/useInventoryDB";
import { useAuth } from "@/contexts/AuthContext";
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
import { StockRunHistory } from "@/components/inventory/StockRunHistory";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  available: number;
}

interface LastStockRun {
  items: { id: string; name: string; quantity: number }[];
  timestamp: number;
  runDate: string;
  historyId: string | null;
}

const LAST_STOCK_RUN_KEY = "clawops_last_stock_run";

export function InventoryTrackerComponent() {
  const { user } = useAuth();
  const { items, isLoaded, addItem, updateItem, deleteItem, updateQuantity, bulkDeductQuantities, bulkAddQuantities } = useInventory();
  const [searchQuery, setSearchQuery] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemPackageType, setNewItemPackageType] = useState("Case");
  const [newItemPackageQty, setNewItemPackageQty] = useState(24);
  const [newItemMinStock, setNewItemMinStock] = useState(10);
  const [newItemLastPrice, setNewItemLastPrice] = useState<string>("");
  
  // Stock Run state
  const [isStockRunMode, setIsStockRunMode] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [stockRunDate, setStockRunDate] = useState<Date>(new Date());
  
  // Return Stock state
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [returnCart, setReturnCart] = useState<CartItem[]>([]);
  const [showReturnSheet, setShowReturnSheet] = useState(false);
  const [lastStockRun, setLastStockRun] = useState<LastStockRun | null>(null);
  
  // Custom quantity input state
  const [customQtyItemId, setCustomQtyItemId] = useState<string | null>(null);
  const [customQtyValue, setCustomQtyValue] = useState("");
  
  // Edit item dialog state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editPackageType, setEditPackageType] = useState("");
  const [editPackageQty, setEditPackageQty] = useState(24);
  const [editMinStock, setEditMinStock] = useState(10);
  const [editLastPrice, setEditLastPrice] = useState<string>("");
  const [editSupplierName, setEditSupplierName] = useState("");
  const [editSupplierUrl, setEditSupplierUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Expanded item state
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // History refresh trigger
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Load last stock run from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LAST_STOCK_RUN_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LastStockRun;
        // Only use if less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setLastStockRun(parsed);
        } else {
          localStorage.removeItem(LAST_STOCK_RUN_KEY);
        }
      } catch {
        localStorage.removeItem(LAST_STOCK_RUN_KEY);
      }
    }
  }, []);

  const handleQuickAdd = async () => {
    if (!newItemName.trim()) {
      toast({
        title: "Enter a name",
        description: "Please enter an item name.",
        variant: "destructive",
      });
      return;
    }

    const lastPrice = newItemLastPrice ? parseFloat(newItemLastPrice) : null;
    
    const item = await addItem({
      name: newItemName.trim(),
      category: "General",
      quantity: newItemQty,
      minStock: newItemMinStock,
      location: "",
      packageType: newItemPackageType,
      packageQuantity: newItemPackageQty,
      supplierUrl: null,
      supplierName: null,
      lastPrice: lastPrice,
      pricePerItem: lastPrice && newItemPackageQty ? lastPrice / newItemPackageQty : null,
      notes: null,
    });

    if (item) {
      setNewItemName("");
      setNewItemQty(10);
      setNewItemPackageType("Case");
      setNewItemPackageQty(24);
      setNewItemMinStock(10);
      setNewItemLastPrice("");
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
    setEditMinStock(item.minStock);
    setEditLastPrice(item.lastPrice?.toString() || "");
    setEditSupplierName(item.supplierName || "");
    setEditSupplierUrl(item.supplierUrl || "");
    setEditNotes(item.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const lastPrice = editLastPrice ? parseFloat(editLastPrice) : null;
    const pricePerItem = lastPrice && editPackageQty ? lastPrice / editPackageQty : null;
    
    await updateItem(editingItem.id, {
      packageType: editPackageType,
      packageQuantity: editPackageQty,
      minStock: editMinStock,
      lastPrice: lastPrice,
      pricePerItem: pricePerItem,
      supplierName: editSupplierName || null,
      supplierUrl: editSupplierUrl || null,
      notes: editNotes || null,
    });
    setEditingItem(null);
    toast({
      title: "Updated!",
      description: `${editingItem.name} updated.`,
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
    if (cart.length === 0 || !user) return;

    const success = await bulkDeductQuantities(cart.map(c => ({ id: c.id, quantity: c.quantity })));
    
    if (success) {
      // Save to database history with selected date
      const historyItems = cart.map(c => ({ id: c.id, name: c.name, quantity: c.quantity }));
      const historyId = await saveStockRunHistory(user.id, historyItems, stockRunDate);
      
      // Save this stock run for potential returns (localStorage for quick access)
      const stockRunData: LastStockRun = {
        items: historyItems,
        timestamp: Date.now(),
        runDate: stockRunDate.toISOString(),
        historyId: historyId,
      };
      localStorage.setItem(LAST_STOCK_RUN_KEY, JSON.stringify(stockRunData));
      setLastStockRun(stockRunData);
      
      // Trigger history refresh
      setHistoryRefresh(prev => prev + 1);

      toast({
        title: "Stock Run Complete!",
        description: `${totalCartItems} items deducted from ${cart.length} products.`,
      });
      setCart([]);
      setShowConfirmSheet(false);
      setIsStockRunMode(false);
      setStockRunDate(new Date()); // Reset date for next run
    }
  };

  const cancelStockRun = () => {
    setCart([]);
    setIsStockRunMode(false);
    setStockRunDate(new Date()); // Reset date when canceling
  };

  // Return Stock functions
  const addToReturnCart = (itemId: string, qty: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setReturnCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing) {
        return prev.map(c => c.id === itemId ? { ...c, quantity: existing.quantity + qty } : c);
      }
      return [...prev, { id: itemId, name: item.name, quantity: qty, available: item.quantity }];
    });
  };

  const removeFromReturnCart = (itemId: string) => {
    setReturnCart(prev => prev.filter(c => c.id !== itemId));
  };

  const updateReturnCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromReturnCart(itemId);
    } else {
      setReturnCart(prev => prev.map(c => 
        c.id === itemId ? { ...c, quantity: newQty } : c
      ));
    }
  };

  const getReturnCartQuantity = (itemId: string) => {
    return returnCart.find(c => c.id === itemId)?.quantity || 0;
  };

  const totalReturnItems = returnCart.reduce((sum, c) => sum + c.quantity, 0);

  const handleConfirmReturn = async () => {
    if (returnCart.length === 0) return;

    const success = await bulkAddQuantities(returnCart.map(c => ({ id: c.id, quantity: c.quantity })));
    
    if (success) {
      // Update history with returned items if we have a history ID
      if (lastStockRun?.historyId) {
        const returnItems = returnCart.map(c => ({ id: c.id, name: c.name, quantity: c.quantity }));
        await updateStockRunReturns(lastStockRun.historyId, returnItems);
        setHistoryRefresh(prev => prev + 1);
      }
      
      toast({
        title: "Stock Returned!",
        description: `${totalReturnItems} items added back to ${returnCart.length} products.`,
      });
      setReturnCart([]);
      setShowReturnSheet(false);
      setIsReturnMode(false);
    }
  };

  const cancelReturnMode = () => {
    setReturnCart([]);
    setIsReturnMode(false);
  };

  const handleCustomReturnQtyAdd = (itemId: string) => {
    const qty = parseInt(customQtyValue);
    if (qty > 0) {
      addToReturnCart(itemId, qty);
      setCustomQtyItemId(null);
      setCustomQtyValue("");
    }
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
      {/* Mode Buttons */}
      <div className="flex gap-2">
        {!isStockRunMode && !isReturnMode ? (
          <>
            <Button 
              onClick={() => setIsStockRunMode(true)} 
              className="flex-1"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Start Stock Run
            </Button>
            <Button 
              onClick={() => setIsReturnMode(true)} 
              variant="outline"
              className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              size="lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Return Stock
            </Button>
          </>
        ) : isStockRunMode ? (
          <Button 
            onClick={cancelStockRun} 
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel Stock Run
          </Button>
        ) : (
          <Button 
            onClick={cancelReturnMode} 
            variant="outline"
            className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            size="lg"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel Return
          </Button>
        )}
      </div>

      {/* Return Mode Banner */}
      {isReturnMode && lastStockRun && (
        <Card className="p-3 border-emerald-200 bg-emerald-50">
          <p className="text-sm text-emerald-700">
            <span className="font-medium">Last stock run:</span> {lastStockRun.items.length} items, {lastStockRun.items.reduce((sum, i) => sum + i.quantity, 0)} pieces total
          </p>
        </Card>
      )}

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

      {/* Quick Add - Only show when not in stock run or return mode */}
      {!isStockRunMode && !isReturnMode && (
        <Card className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Item name..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              className="flex-1"
            />
            <NumberInput
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
          <div className="flex gap-2 items-center flex-wrap">
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
            <NumberInput
              min="1"
              value={newItemPackageQty}
              onChange={(e) => setNewItemPackageQty(parseInt(e.target.value) || 1)}
              className="w-16 h-8 text-center text-sm"
            />
          </div>
          {/* Price & Low Stock Config */}
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Last price:</span>
            <div className="relative w-24">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newItemLastPrice}
                onChange={(e) => setNewItemLastPrice(e.target.value)}
                className="h-8 text-sm pl-6"
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">Alert at:</span>
            <NumberInput
              min="0"
              value={newItemMinStock}
              onChange={(e) => setNewItemMinStock(parseInt(e.target.value) || 0)}
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
            const returnQty = getReturnCartQuantity(item.id);
            const isInReturnCart = returnQty > 0;
            const wasInLastRun = lastStockRun?.items.some(i => i.id === item.id);
            
            return (
              <Card
                key={item.id}
                className={cn(
                  "p-3 transition-colors",
                  item.quantity <= item.minStock && !isReturnMode && "border-destructive/30 bg-destructive/5",
                  isStockRunMode && isInCart && "border-primary bg-primary/5",
                  isReturnMode && isInReturnCart && "border-emerald-500 bg-emerald-50",
                  isReturnMode && wasInLastRun && !isInReturnCart && "border-emerald-200"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Name & Status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.name}</span>
                      {item.quantity <= item.minStock && !isReturnMode && (
                        <Badge variant="destructive" className="text-xs shrink-0">
                          Low
                        </Badge>
                      )}
                      {isStockRunMode && isInCart && (
                        <Badge className="text-xs shrink-0">
                          {cartQty} in cart
                        </Badge>
                      )}
                      {isReturnMode && isInReturnCart && (
                        <Badge className="text-xs shrink-0 bg-emerald-500">
                          +{returnQty} returning
                        </Badge>
                      )}
                      {isReturnMode && wasInLastRun && !isInReturnCart && (
                        <Badge variant="outline" className="text-xs shrink-0 border-emerald-300 text-emerald-600">
                          From last run
                        </Badge>
                      )}
                      {!isStockRunMode && !isReturnMode && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground"
                            onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                          >
                            {expandedItemId === item.id ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                    {isStockRunMode || isReturnMode ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.quantity} in inventory
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.packageType} of {item.packageQuantity}
                        {item.lastPrice && (
                          <span className="ml-2">
                            • ${item.lastPrice.toFixed(2)} (${item.pricePerItem?.toFixed(2)}/ea)
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Stock Run Mode Controls */}
                  {isStockRunMode ? (
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {customQtyItemId === item.id ? (
                        <div className="flex items-center gap-1">
                          <NumberInput
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
                  ) : isReturnMode ? (
                    /* Return Mode Controls */
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {customQtyItemId === item.id ? (
                        <div className="flex items-center gap-1">
                          <NumberInput
                            min="1"
                            value={customQtyValue}
                            onChange={(e) => setCustomQtyValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCustomReturnQtyAdd(item.id)}
                            className="w-16 h-8 text-center border-emerald-300"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            className="h-8 px-2 bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => handleCustomReturnQtyAdd(item.id)}
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
                            className="h-8 px-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => addToReturnCart(item.id, 5)}
                          >
                            +5
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => addToReturnCart(item.id, 10)}
                          >
                            +10
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => addToReturnCart(item.id, 20)}
                          >
                            +20
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => addToReturnCart(item.id, item.packageQuantity)}
                          >
                            +{item.packageQuantity} {item.packageType}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => setCustomQtyItemId(item.id)}
                          >
                            Cust
                          </Button>
                          {isInReturnCart && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeFromReturnCart(item.id)}
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
                
                {/* Expanded Details Section */}
                {!isStockRunMode && !isReturnMode && expandedItemId === item.id && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Alert at:</span>
                        <span className="ml-1 font-medium">{item.minStock} items</span>
                      </div>
                      {item.lastPrice && (
                        <div>
                          <span className="text-muted-foreground">Last price:</span>
                          <span className="ml-1 font-medium">${item.lastPrice.toFixed(2)}</span>
                        </div>
                      )}
                      {item.pricePerItem && (
                        <div>
                          <span className="text-muted-foreground">Per item:</span>
                          <span className="ml-1 font-medium">${item.pricePerItem.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    {item.supplierName && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Supplier:</span>
                        <span className="ml-1 font-medium">{item.supplierName}</span>
                        {item.supplierUrl && (
                          <a 
                            href={item.supplierUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        )}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="mt-0.5 text-muted-foreground/80 italic">{item.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Low Stock Summary - Only show when not in any mode */}
      {!isStockRunMode && !isReturnMode && lowStockItems.length > 0 && (
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

      {/* Stock Run History - Only show when not in any mode */}
      {!isStockRunMode && !isReturnMode && (
        <StockRunHistory refreshTrigger={historyRefresh} />
      )}

      {/* Floating Cart Summary - Stock Run */}
      {isStockRunMode && cart.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
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

      {/* Floating Cart Summary - Return Stock */}
      {isReturnMode && returnCart.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <Card className="p-4 bg-emerald-500 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5" />
                <div>
                  <p className="font-semibold">{returnCart.length} items</p>
                  <p className="text-sm opacity-90">{totalReturnItems} pieces to return</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => setShowReturnSheet(true)}
              >
                <Check className="h-4 w-4 mr-2" />
                Review
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Stock Run Confirmation Sheet */}
      <Sheet open={showConfirmSheet} onOpenChange={setShowConfirmSheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Confirm Stock Run</SheetTitle>
            <SheetDescription>
              Review items to deduct from inventory
            </SheetDescription>
          </SheetHeader>
          
          {/* Date Picker */}
          <div className="py-4 border-b">
            <Label className="text-sm font-medium mb-2 block">Stock Run Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !stockRunDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {stockRunDate ? format(stockRunDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={stockRunDate}
                  onSelect={(date) => date && setStockRunDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="py-4 space-y-3 overflow-y-auto max-h-[calc(80vh-260px)]">
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

      {/* Return Stock Confirmation Sheet */}
      <Sheet open={showReturnSheet} onOpenChange={setShowReturnSheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle className="text-emerald-600">Confirm Stock Return</SheetTitle>
            <SheetDescription>
              Review items to add back to inventory
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-4 space-y-3 overflow-y-auto max-h-[calc(80vh-180px)]">
            {returnCart.map((returnItem) => (
              <Card key={returnItem.id} className="p-3 border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{returnItem.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Currently {returnItem.available} in stock
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-emerald-300"
                      onClick={() => updateReturnCartQuantity(returnItem.id, returnItem.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={returnItem.quantity}
                      onChange={(e) => updateReturnCartQuantity(returnItem.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center font-bold border-emerald-300"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-emerald-300"
                      onClick={() => updateReturnCartQuantity(returnItem.id, returnItem.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromReturnCart(returnItem.id)}
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
              <p className="text-lg font-bold text-emerald-600">+{totalReturnItems} total pieces</p>
              <p className="text-sm text-muted-foreground">returning to {returnCart.length} products</p>
            </div>
            <Button 
              onClick={handleConfirmReturn} 
              className="w-full bg-emerald-500 hover:bg-emerald-600" 
              size="lg"
              disabled={returnCart.length === 0}
            >
              <Check className="h-5 w-5 mr-2" />
              Confirm Return
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Packaging Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Packaging</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Qty per {editPackageType}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editPackageQty}
                    onChange={(e) => setEditPackageQty(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Pricing</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Last Price Paid</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={editLastPrice}
                      onChange={(e) => setEditLastPrice(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Price Per Item</Label>
                  <div className="h-9 px-3 flex items-center bg-muted rounded-md text-sm">
                    {editLastPrice && editPackageQty 
                      ? `$${(parseFloat(editLastPrice) / editPackageQty).toFixed(2)}` 
                      : "—"
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Alert Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Stock Alert</h4>
              <div className="space-y-1.5">
                <Label className="text-xs">Alert when stock falls below</Label>
                <Input
                  type="number"
                  min="0"
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Supplier Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Supplier</h4>
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Supplier Name</Label>
                  <Input
                    placeholder="e.g., Oriental Trading"
                    value={editSupplierName}
                    onChange={(e) => setEditSupplierName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Purchase Link</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={editSupplierUrl}
                    onChange={(e) => setEditSupplierUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Notes</h4>
              <Textarea
                placeholder="Add notes about this item..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
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
