import { useEffect, useState } from "react";
import { RevenueTrackerComponent } from "@/components/RevenueTrackerComponent";
import { useRevenueEntries } from "@/hooks/useRevenueEntriesDB";
import { useRecurringRevenue } from "@/hooks/useRecurringRevenue";
import { useMobileRefresh } from "@/contexts/MobileRefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const RevenueTracker = () => {
  const { refetch } = useRevenueEntries();
  const { dueCount, generateDueEntries } = useRecurringRevenue();
  const isMobile = useIsMobile();
  const { registerRefresh, unregisterRefresh } = useMobileRefresh();
  const [isGenerating, setIsGenerating] = useState(false);

  // Register mobile refresh callback
  useEffect(() => {
    if (isMobile) {
      registerRefresh("revenue", refetch);
      return () => unregisterRefresh("revenue");
    }
  }, [isMobile, registerRefresh, unregisterRefresh, refetch]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const count = await generateDueEntries();
    setIsGenerating(false);
    if (count > 0) {
      toast({ title: "Entries Generated", description: `${count} revenue entries created.` });
      refetch();
    } else {
      toast({ title: "No Due Entries", description: "All recurring entries are up to date." });
    }
  };

  return (
    <div className="bg-background">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Revenue Tracker</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Track collections and revenue across your claw machine locations
          </p>
        </div>

        {dueCount > 0 && (
          <Alert className="mb-4 border-primary/30 bg-primary/5">
            <AlertDescription className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4 text-primary" />
                {dueCount} recurring {dueCount === 1 ? "entry is" : "entries are"} due
              </span>
              <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <RevenueTrackerComponent />
      </div>
    </div>
  );
};

export default RevenueTracker;
