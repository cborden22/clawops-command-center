import { useEffect } from "react";
import { RevenueTrackerComponent } from "@/components/RevenueTrackerComponent";
import { RecurringRevenueManager } from "@/components/revenue/RecurringRevenueManager";
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
    <div className="bg-background">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Revenue Tracker</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Track collections and revenue across your claw machine locations
          </p>
        </div>
        <div className="space-y-6">
          <RecurringRevenueManager />
          <RevenueTrackerComponent />
        </div>
      </div>
    </div>
  );
};

export default RevenueTracker;
