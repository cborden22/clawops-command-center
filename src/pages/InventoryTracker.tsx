import { useEffect } from "react";
import { InventoryTrackerComponent } from "@/components/InventoryTrackerComponent";
import { useInventory } from "@/hooks/useInventoryDB";
import { useMobileRefresh } from "@/contexts/MobileRefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Inventory Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Track your claw machine inventory, prizes, and supplies
          </p>
        </div>
        <InventoryTrackerComponent />
      </div>
    </div>
  );
};

export default InventoryTracker;
