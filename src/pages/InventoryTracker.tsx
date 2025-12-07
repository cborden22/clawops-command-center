import { InventoryTrackerComponent } from "@/components/InventoryTrackerComponent";

const InventoryTracker = () => {
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
