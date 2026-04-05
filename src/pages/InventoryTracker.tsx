import { useEffect } from "react";
import { InventoryTrackerComponent } from "@/components/InventoryTrackerComponent";
import { StorageLocationView } from "@/components/inventory/StorageLocationView";
import { useInventory } from "@/hooks/useInventoryDB";
import { useMobileRefresh } from "@/contexts/MobileRefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MapPin } from "lucide-react";

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
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory Tracker</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Track your claw machine inventory, prizes, and supplies
          </p>
        </div>
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
          </TabsList>
          <TabsContent value="inventory">
            <InventoryTrackerComponent />
          </TabsContent>
          <TabsContent value="storage">
            <StorageLocationView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InventoryTracker;
