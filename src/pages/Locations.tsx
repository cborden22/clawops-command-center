import { useState, useEffect } from "react";
import { LocationTrackerComponent } from "@/components/LocationTrackerComponent";
import { MachinesManager } from "@/components/MachinesManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Sparkles } from "lucide-react";
import { useLocations } from "@/hooks/useLocationsDB";
import { useMobileRefresh } from "@/contexts/MobileRefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Locations = () => {
  const [activeTab, setActiveTab] = useState("locations");
  const { refetch } = useLocations();
  const isMobile = useIsMobile();
  const { registerRefresh, unregisterRefresh } = useMobileRefresh();

  // Register mobile refresh callback
  useEffect(() => {
    if (isMobile) {
      registerRefresh("locations", refetch);
      return () => unregisterRefresh("locations");
    }
  }, [isMobile, registerRefresh, unregisterRefresh, refetch]);

  return (
    <div className="bg-background">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Location Tracker</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Manage all your claw machine locations and machines in one place
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="machines" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Machines
            </TabsTrigger>
          </TabsList>

          <TabsContent value="locations">
            <LocationTrackerComponent />
          </TabsContent>

          <TabsContent value="machines">
            <MachinesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Locations;
