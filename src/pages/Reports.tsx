import { useState, useRef, useCallback } from "react";
import { format } from "date-fns";
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
import { handleExport, ExportType } from "@/utils/csvExport";
import { generatePDFFromHTML } from "@/utils/pdfGenerator";
import { toast } from "@/hooks/use-toast";

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>(() => 
    getDateRangeFromPreset("this_month")
  );
  const [activeTab, setActiveTab] = useState("locations");
  const reportContentRef = useRef<HTMLDivElement>(null);
  const reportData = useReportsData(dateRange);

  const handleExportCSV = (exportType: ExportType) => {
    const dateStr = format(dateRange.start, "yyyy-MM-dd") + "_" + format(dateRange.end, "yyyy-MM-dd");
    handleExport(exportType, reportData, dateStr);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = useCallback(async () => {
    if (!reportContentRef.current) return;
    const dateStr = format(dateRange.start, "MMM-d-yyyy") + "_to_" + format(dateRange.end, "MMM-d-yyyy");
    try {
      await generatePDFFromHTML(reportContentRef.current.innerHTML, {
        filename: `ClawOps-Report-${activeTab}-${dateStr}.pdf`,
        orientation: "landscape",
      });
      toast({ title: "PDF Exported", description: "Report saved as PDF." });
    } catch {
      toast({ title: "Export Failed", description: "Could not generate PDF.", variant: "destructive" });
    }
  }, [dateRange, activeTab]);

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
        onExportPDF={handleExportPDF}
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

        <div ref={reportContentRef}>

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
        </div>
      </Tabs>
    </div>
  );
}
