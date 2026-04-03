import { useState } from "react";
import { useInventory, InventoryItem } from "@/hooks/useInventoryDB";
import { useInventoryBalances } from "@/hooks/useInventoryBalances";
import { useInventoryLocations } from "@/hooks/useInventoryLocations";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, MapPin, DollarSign, AlertTriangle, Plus, Search, Archive } from "lucide-react";
import { InventoryItemDetail } from "./InventoryItemDetail";
import { InventoryItemForm } from "./InventoryItemForm";

const CATEGORIES = ["All", "Plush", "Parts", "Machines", "Bulk"];

export function InventoryDashboard() {
  const { items, addItem, updateItem, deleteItem } = useInventory();
  const { balances, getTotalQuantity, getLocationCount, addBalance, updateBalance, deleteBalance } = useInventoryBalances();
  const { locations } = useInventoryLocations();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("active");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const filteredItems = items.filter(item => {
    const matchesSearch = !search || 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesActive = activeFilter === "all" || 
      (activeFilter === "active" && item.active) || 
      (activeFilter === "inactive" && !item.active);
    return matchesSearch && matchesCategory && matchesActive;
  });

  // Summary calculations
  const activeItems = items.filter(i => i.active);
  const totalUnits = activeItems.reduce((sum, item) => sum + getTotalQuantity(item.id), 0);
  const activeLocations = locations.filter(l => l.active).length;
  const totalValue = activeItems.reduce((sum, item) => {
    const qty = getTotalQuantity(item.id);
    const cost = item.pricePerItem || 0;
    return sum + (qty * cost);
  }, 0);

  const getStockStatus = (item: InventoryItem) => {
    if (!item.minStock || item.minStock <= 0) return null;
    const total = getTotalQuantity(item.id);
    return total <= item.minStock ? "low" : "ok";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium">Total Items</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Archive className="h-4 w-4" />
              <span className="text-xs font-medium">Total Units</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalUnits.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium">Active Locations</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeLocations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Est. Value</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditingItem(null); setShowAddForm(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Items Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead className="hidden sm:table-cell">SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Locations</TableHead>
                <TableHead className="text-right hidden md:table-cell">Unit Cost</TableHead>
                <TableHead>Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {items.length === 0 ? "No inventory items yet. Add your first item!" : "No items match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => {
                  const totalQty = getTotalQuantity(item.id);
                  const locCount = getLocationCount(item.id);
                  const status = getStockStatus(item);
                  return (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedItem(item)}
                    >
                      <TableCell className="font-medium">
                        {item.name}
                        {!item.active && <Badge variant="outline" className="ml-2 text-xs">Inactive</Badge>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{item.sku || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{item.category || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{totalQty.toLocaleString()}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell tabular-nums">{locCount}</TableCell>
                      <TableCell className="text-right hidden md:table-cell tabular-nums">
                        {item.pricePerItem ? `$${item.pricePerItem.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        {status === "low" && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" /> Low
                          </Badge>
                        )}
                        {status === "ok" && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Item Detail Dialog */}
      {selectedItem && (
        <InventoryItemDetail
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={(open) => { if (!open) setSelectedItem(null); }}
          balances={balances.filter(b => b.inventory_item_id === selectedItem.id)}
          locations={locations}
          onAddBalance={addBalance}
          onUpdateBalance={updateBalance}
          onDeleteBalance={deleteBalance}
          onEditItem={() => { setEditingItem(selectedItem); setShowAddForm(true); setSelectedItem(null); }}
          onDeleteItem={async () => { await deleteItem(selectedItem.id); setSelectedItem(null); }}
        />
      )}

      {/* Add/Edit Item Form */}
      {showAddForm && (
        <InventoryItemForm
          open={showAddForm}
          onOpenChange={setShowAddForm}
          item={editingItem}
          onSave={async (data) => {
            if (editingItem) {
              await updateItem(editingItem.id, data);
            } else {
              await addItem({
                ...data,
                quantity: 0,
                location: "",
                packageType: "Case",
                packageQuantity: 1,
                supplierUrl: null,
                supplierName: null,
                lastPrice: data.pricePerItem || null,
                warehouseId: null,
                zoneId: null,
              });
            }
            setShowAddForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
