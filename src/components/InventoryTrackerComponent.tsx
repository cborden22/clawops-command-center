import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package, AlertTriangle, Minus, Search, Filter, Boxes } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useInventory } from "@/hooks/useInventoryDB";

const CATEGORIES = ["Plush Toys", "Electronics", "Accessories", "Supplies", "Other"];

export function InventoryTrackerComponent() {
  const { items, isLoaded, addItem, deleteItem, updateQuantity } = useInventory();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    quantity: 0,
    minStock: 5,
    location: "",
  });

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the name and category.",
        variant: "destructive",
      });
      return;
    }

    const item = await addItem({
      name: newItem.name,
      category: newItem.category,
      quantity: newItem.quantity,
      minStock: newItem.minStock,
      location: newItem.location,
    });

    if (item) {
      setNewItem({ name: "", category: "", quantity: 0, minStock: 5, location: "" });
      setShowAddForm(false);
      toast({
        title: "Item Added",
        description: `${item.name} has been added to inventory.`,
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    await deleteItem(id);
    toast({
      title: "Item Removed",
      description: `${item?.name || "Item"} has been removed from inventory.`,
    });
  };

  const handleUpdateQuantity = async (id: string, change: number) => {
    await updateQuantity(id, change);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = items.filter((item) => item.quantity <= item.minStock);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!isLoaded) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-muted to-muted/80 shadow-md group-hover:scale-110 transition-transform duration-300">
                <Boxes className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Product Types</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden",
          lowStockItems.length > 0 && "border-destructive/30 bg-destructive/5"
        )}>
          <CardContent className="pt-6 relative">
            <div className={cn(
              "absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500",
              lowStockItems.length > 0 ? "bg-destructive/10" : "bg-accent/50"
            )} />
            <div className="flex items-center gap-4 relative">
              <div className={cn(
                "p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300",
                lowStockItems.length > 0 
                  ? "bg-gradient-to-br from-destructive to-destructive/80" 
                  : "bg-gradient-to-br from-muted to-muted/80"
              )}>
                <AlertTriangle className={cn(
                  "h-6 w-6",
                  lowStockItems.length > 0 ? "text-destructive-foreground" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Alerts</p>
                <p className={cn(
                  "text-3xl font-bold tracking-tight",
                  lowStockItems.length > 0 ? "text-destructive" : "text-foreground"
                )}>
                  {lowStockItems.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Inventory Card */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 gap-4 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            Inventory Items
          </CardTitle>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="premium-button">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {/* Add Item Form */}
          {showAddForm && (
            <div className="mb-6 p-5 rounded-xl bg-muted/30 border border-border/50 space-y-4 animate-scale-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Item Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Large Teddy Bear"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="h-11 bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger className="h-11 bg-background">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-muted-foreground">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Warehouse A"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    className="h-11 bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">Initial Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })
                    }
                    className="h-11 bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minStock" className="text-sm font-medium">Low Stock Threshold</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    value={newItem.minStock}
                    onChange={(e) =>
                      setNewItem({ ...newItem, minStock: parseInt(e.target.value) || 0 })
                    }
                    className="h-11 bg-background"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleAddItem} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Save Item
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-background/50"
                />
              </div>
              <div className="min-w-[150px]">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-10 bg-background/50">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Inventory Table */}
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-muted-foreground">No inventory items yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Click "Add Item" to get started</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No items match your search</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="text-center font-semibold">Quantity</TableHead>
                    <TableHead className="font-semibold">Last Updated</TableHead>
                    <TableHead className="text-right font-semibold w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "group transition-colors",
                        item.quantity <= item.minStock && "bg-destructive/5 hover:bg-destructive/10"
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.name}
                          {item.quantity <= item.minStock && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Low
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.location || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className={cn(
                            "w-12 text-center font-bold text-lg",
                            item.quantity <= item.minStock && "text-destructive"
                          )}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.lastUpdated}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert Card */}
      {lowStockItems.length > 0 && (
        <Card className="glass-card border-destructive/20 bg-destructive/5 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-destructive/10 to-transparent border-b border-destructive/10">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-2">
              {lowStockItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive" className="h-6 w-6 p-0 flex items-center justify-center rounded-full">
                      {item.quantity}
                    </Badge>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Min: {item.minStock}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
