import * as React from "react";
import { useState, useEffect } from "react";
import { LocationTrackerComponent } from "@/components/LocationTrackerComponent";
import { MachinesManager } from "@/components/MachinesManager";
import { CommissionSummaryGenerator } from "@/components/CommissionSummaryGenerator";
import { AgreementGenerator } from "@/components/AgreementGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Sparkles, Map, Receipt, FileText } from "lucide-react";
import { useLocations } from "@/hooks/useLocationsDB";
import { useMobileRefresh } from "@/contexts/MobileRefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";

const LocationMap = React.lazy(() => import("./LocationMap"));

class MapErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <p>Failed to load the map. Please try refreshing.</p>
          <button className="text-primary underline" onClick={() => this.setState({ hasError: false })}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Locations = () => {
  const [activeTab, setActiveTab] = useState("locations");
  const { refetch } = useLocations();
  const isMobile = useIsMobile();
  const { registerRefresh, unregisterRefresh } = useMobileRefresh();

  useEffect(() => {
    if (isMobile) {
      registerRefresh("locations", refetch);
      return () => unregisterRefresh("locations");
    }
  }, [isMobile, registerRefresh, unregisterRefresh, refetch]);

  return (
    <div className="bg-background">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="mb-4 sm:mb-6 hidden sm:block">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Locations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage locations, machines, map view, commissions, and agreements
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="bg-muted/50 inline-flex w-auto min-w-full sm:w-full gap-0.5 p-1">
              <TabsTrigger value="locations" className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 flex-1">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Locations</span>
              </TabsTrigger>
              <TabsTrigger value="machines" className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 flex-1">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Machines</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 flex-1">
                <Map className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Map</span>
              </TabsTrigger>
              <TabsTrigger value="commissions" className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 flex-1">
                <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Commissions</span>
              </TabsTrigger>
              <TabsTrigger value="agreements" className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 flex-1">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Agreements</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="locations">
            <LocationTrackerComponent />
          </TabsContent>

          <TabsContent value="machines">
            <MachinesManager />
          </TabsContent>

          <TabsContent value="map">
            <MapErrorBoundary>
              <React.Suspense fallback={
                <div className="min-h-[40vh] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading map...</div>
                </div>
              }>
                <LocationMap />
              </React.Suspense>
            </MapErrorBoundary>
          </TabsContent>

          <TabsContent value="commissions">
            <CommissionSummaryGenerator />
          </TabsContent>

          <TabsContent value="agreements">
            <AgreementGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Locations;
