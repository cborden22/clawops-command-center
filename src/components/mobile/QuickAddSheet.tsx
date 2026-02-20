import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign, Car, Package, Route, Play, MapPin } from "lucide-react";
import { QuickRevenueForm } from "./QuickRevenueForm";
import { QuickMileageForm } from "./QuickMileageForm";
import { QuickInventoryForm } from "./QuickInventoryForm";
import { useRoutes } from "@/hooks/useRoutesDB";

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const [activeTab, setActiveTab] = useState("revenue");
  const navigate = useNavigate();
  const { routes, isLoaded: routesLoaded } = useRoutes();

  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleRunRoute = (routeId: string) => {
    onOpenChange(false);
    navigate(`/mileage?runRoute=${routeId}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-2xl flex flex-col"
        style={{ 
          maxHeight: 'calc(85vh - env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <SheetHeader className="pb-2 flex-shrink-0">
          <SheetTitle className="text-center">Quick Add</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-4 w-full flex-shrink-0">
            <TabsTrigger value="revenue" className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              <span className="hidden xs:inline">Revenue</span>
            </TabsTrigger>
            <TabsTrigger value="mileage" className="flex items-center gap-1.5">
              <Car className="h-4 w-4" />
              <span className="hidden xs:inline">Mileage</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              <span className="hidden xs:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="route" className="flex items-center gap-1.5">
              <Route className="h-4 w-4" />
              <span className="hidden xs:inline">Route</span>
            </TabsTrigger>
          </TabsList>

          <div 
            className="mt-4 flex-1 overflow-y-auto overscroll-contain sheet-scroll-content"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <TabsContent value="revenue" className="mt-0">
              <QuickRevenueForm onSuccess={handleSuccess} />
            </TabsContent>

            <TabsContent value="mileage" className="mt-0">
              <QuickMileageForm onSuccess={handleSuccess} />
            </TabsContent>

            <TabsContent value="inventory" className="mt-0">
              <QuickInventoryForm onSuccess={handleSuccess} />
            </TabsContent>

            <TabsContent value="route" className="mt-0">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Select a route to start a guided run.</p>
                {!routesLoaded ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading routes...</p>
                ) : routes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No saved routes yet.</p>
                ) : (
                  routes.map((route) => (
                    <Button
                      key={route.id}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 px-4"
                      onClick={() => handleRunRoute(route.id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Play className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-sm truncate">{route.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {route.stops.length} stops · {route.totalMiles.toFixed(1)} mi
                          </p>
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
