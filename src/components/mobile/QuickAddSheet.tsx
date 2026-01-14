import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Car, Package } from "lucide-react";
import { QuickRevenueForm } from "./QuickRevenueForm";
import { QuickMileageForm } from "./QuickMileageForm";
import { QuickInventoryForm } from "./QuickInventoryForm";

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const [activeTab, setActiveTab] = useState("revenue");

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-center">Quick Add</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid grid-cols-3 w-full">
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
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[calc(85vh-140px)]">
            <TabsContent value="revenue" className="mt-0">
              <QuickRevenueForm onSuccess={handleSuccess} />
            </TabsContent>

            <TabsContent value="mileage" className="mt-0">
              <QuickMileageForm onSuccess={handleSuccess} />
            </TabsContent>

            <TabsContent value="inventory" className="mt-0">
              <QuickInventoryForm onSuccess={handleSuccess} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
