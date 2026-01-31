import { useState } from "react";
import { BarChart3, MapPin, Cpu, DollarSign, Package, Car, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { LocationReports } from "@/components/reports/LocationReports";
import { MachineReports } from "@/components/reports/MachineReports";
import { FinancialReports } from "@/components/reports/FinancialReports";
import { InventoryReports } from "@/components/reports/InventoryReports";
import { RoutesReports } from "@/components/reports/RoutesReports";
import { WinRateReports } from "@/components/reports/WinRateReports";
import { useReportsData, DateRange, getDateRangeFromPreset } from "@/hooks/useReportsData";

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>(() => 
    getDateRangeFromPreset("this_month")
  );
  const [activeTab, setActiveTab] = useState("locations");

  const reportData = useReportsData(dateRange);

  const handleExportCSV = () => {
    // TODO: Implement CSV export based on active tab
    console.log("Exporting CSV for", activeTab);
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { value: "locations", label: "Locations", icon: MapPin },
    { value: "machines", label: "Machines", icon: Cpu },
    { value: "financial", label: "Financial", icon: DollarSign },
    { value: "inventory", label: "Inventory", icon: Package },
    { value: "routes", label: "Routes", icon: Car },
    { value: "winrate", label: "Win Rate", icon: Target },
  ];

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Business Reports</h1>
            <p className="text-muted-foreground text-sm">
              Analyze performance across your claw machine business
            </p>
          </div>
        </div>
      </div>

      <DateRangeFilter
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 bg-muted/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 px-4 py-2 whitespace-nowrap data-[state=active]:bg-background"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="locations" className="mt-6">
          <LocationReports data={reportData} />
        </TabsContent>

        <TabsContent value="machines" className="mt-6">
          <MachineReports data={reportData} />
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <FinancialReports data={reportData} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <InventoryReports data={reportData} />
        </TabsContent>

        <TabsContent value="routes" className="mt-6">
          <RoutesReports data={reportData} />
        </TabsContent>

        <TabsContent value="winrate" className="mt-6">
          <WinRateReports data={reportData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
