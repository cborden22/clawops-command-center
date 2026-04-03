import { useEffect } from "react";
import { useInventory } from "@/hooks/useInventoryDB";
import { useMobileRefresh } from "@/contexts/MobileRefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MapPin } from "lucide-react";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";
import { InventoryLocationsList } from "@/components/inventory/InventoryLocationsList";

const InventoryTracker = () => {
  const { refetch } = useInventory();
  const isMobile = useIsMobile();
  const { registerRefresh, unregisterRefresh } = useMobileRefresh();

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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Track inventory items, quantities, and locations
          </p>
        </div>
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-1.5">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Locations</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <InventoryDashboard />
          </TabsContent>
          <TabsContent value="locations">
            <InventoryLocationsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InventoryTracker;
