import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Warehouse, Package, MapPin } from "lucide-react";
import { useWarehouses } from "@/hooks/useWarehousesDB";
import { useInventory, InventoryItem } from "@/hooks/useInventoryDB";

export function StorageLocationView() {
  const { warehouses, zones } = useWarehouses();
  const { items } = useInventory();

  if (warehouses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No warehouses set up yet</p>
        <p className="text-sm text-muted-foreground/70">
          Go to Settings → Warehouses to create your first warehouse and zones
        </p>
      </Card>
    );
  }

  // Group items by warehouse > zone
  const unassigned = items.filter((i) => !i.warehouseId);

  return (
    <div className="space-y-4">
      {warehouses.map((wh) => {
        const whItems = items.filter((i) => i.warehouseId === wh.id);
        const whZones = zones.filter((z) => z.warehouseId === wh.id);
        const unzonedItems = whItems.filter((i) => !i.zoneId);

        return (
          <Card key={wh.id} className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">{wh.name}</span>
              {wh.isDefault && (
                <Badge variant="secondary" className="text-xs">Default</Badge>
              )}
              <Badge variant="outline" className="text-xs ml-auto">
                {whItems.length} item{whItems.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {whZones.map((zone) => {
              const zoneItems = whItems.filter((i) => i.zoneId === zone.id);
              if (zoneItems.length === 0) return (
                <div key={zone.id} className="ml-4 p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    <span>{zone.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">{zone.zoneType}</Badge>
                    <span className="text-xs italic">Empty</span>
                  </div>
                </div>
              );
              return (
                <div key={zone.id} className="ml-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{zone.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">{zone.zoneType}</Badge>
                    <span className="text-xs text-muted-foreground">{zoneItems.length} item{zoneItems.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="ml-6 space-y-0.5">
                    {zoneItems.map((item) => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}

            {unzonedItems.length > 0 && (
              <div className="ml-4 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  <span>Unassigned Zone</span>
                  <span className="text-xs">{unzonedItems.length} item{unzonedItems.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="ml-6 space-y-0.5">
                  {unzonedItems.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {whItems.length === 0 && (
              <p className="text-sm text-muted-foreground ml-4 italic">No items assigned to this warehouse</p>
            )}
          </Card>
        );
      })}

      {unassigned.length > 0 && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-lg">Unassigned</span>
            <Badge variant="outline" className="text-xs ml-auto">
              {unassigned.length} item{unassigned.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="ml-4 space-y-0.5">
            {unassigned.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ItemRow({ item }: { item: InventoryItem }) {
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 text-sm">
      <span className="truncate">{item.name}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-medium tabular-nums ${item.quantity <= item.minStock ? "text-destructive" : ""}`}>
          {item.quantity}
        </span>
        {item.quantity <= item.minStock && (
          <Badge variant="destructive" className="text-xs">Low</Badge>
        )}
      </div>
    </div>
  );
}
