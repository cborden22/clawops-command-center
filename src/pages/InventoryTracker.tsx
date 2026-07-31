import { useEffect } from "react";
import { InventoryTrackerComponent } from "@/components/InventoryTrackerComponent";
import { StorageLocationView } from "@/components/inventory/StorageLocationView";
import { WarehouseManager } from "@/components/settings/WarehouseManager";
import { useInventory } from "@/hooks/useInventoryDB";
import { useMobileRefresh } from "@/contexts/MobileRefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MapPin, Warehouse } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

const InventoryTracker = () => {
  const { refetch } = useInventory();
  const isMobile = useIsMobile();
  const { registerRefresh, unregisterRefresh } = useMobileRefresh();

  // Register mobile refresh callback
  useEffect(() => {
    if (isMobile) {
      registerRefresh("inventory", refetch);
      return () => unregisterRefresh("inventory");
    }
  }, [isMobile, registerRefresh, unregisterRefresh, refetch]);

  return (
    <div className="bg-background">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <PageHeader
          title="Inventory Tracker"
          description="Track your claw machine inventory, prizes, and supplies"
        />
        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory" className="gap-1.5">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Where Is It?</span>
            </TabsTrigger>
            <TabsTrigger value="warehouses" className="gap-1.5">
              <Warehouse className="h-4 w-4" />
              <span className="hidden sm:inline">Storage Setup</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="inventory">
            <InventoryTrackerComponent />
          </TabsContent>
          <TabsContent value="storage">
            <StorageLocationView />
          </TabsContent>
          <TabsContent value="warehouses">
            <WarehouseManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InventoryTracker;
