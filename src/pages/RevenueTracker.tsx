import { useEffect } from "react";
import { RevenueTrackerComponent } from "@/components/RevenueTrackerComponent";
import { useRevenueEntries } from "@/hooks/useRevenueEntriesDB";
import { useMobileRefresh } from "@/contexts/MobileRefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";

const RevenueTracker = () => {
  const { refetch } = useRevenueEntries();
  const isMobile = useIsMobile();
  const { registerRefresh, unregisterRefresh } = useMobileRefresh();

  // Register mobile refresh callback
  useEffect(() => {
    if (isMobile) {
      registerRefresh("revenue", refetch);
      return () => unregisterRefresh("revenue");
    }
  }, [isMobile, registerRefresh, unregisterRefresh, refetch]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Revenue Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Track collections and revenue across your claw machine locations
          </p>
        </div>
        <RevenueTrackerComponent />
      </div>
    </div>
  );
};

export default RevenueTracker;
