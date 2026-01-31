import { format } from "date-fns";
import type { ReportsData } from "@/hooks/useReportsData";

export function generateCSV(headers: string[], rows: string[][]): string {
  const headerRow = headers.join(",");
  const dataRows = rows.map(row => 
    row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
  );
  return [headerRow, ...dataRows].join("\n");
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// Location Exports
export function exportLocationBreakdown(data: ReportsData, dateStr: string): void {
  const headers = ["Location", "Revenue", "Expenses", "Commission", "Profit", "Machines"];
  const rows = data.locationPerformance.map(loc => [
    loc.name,
    formatCurrency(loc.income),
    formatCurrency(loc.expenses),
    formatCurrency(loc.commissions),
    formatCurrency(loc.profit),
    loc.machineCount.toString()
  ]);
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `location_breakdown_${dateStr}`);
}

export function exportTopLocations(data: ReportsData, dateStr: string): void {
  const headers = ["Rank", "Location", "Revenue", "Machines"];
  const sorted = [...data.locationPerformance].sort((a, b) => b.income - a.income);
  const rows = sorted.map((loc, idx) => [
    (idx + 1).toString(),
    loc.name,
    formatCurrency(loc.income),
    loc.machineCount.toString()
  ]);
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `top_locations_${dateStr}`);
}

export function exportLocationProfitability(data: ReportsData, dateStr: string): void {
  const headers = ["Location", "Revenue", "Expenses", "Commission Rate", "Commission", "Net Profit", "Margin %"];
  const rows = data.locationPerformance.map(loc => {
    const margin = loc.income > 0 ? ((loc.profit / loc.income) * 100).toFixed(1) : "0.0";
    return [
      loc.name,
      formatCurrency(loc.income),
      formatCurrency(loc.expenses),
      `${((loc.commission_rate || 0) * 100).toFixed(0)}%`,
      formatCurrency(loc.commissions),
      formatCurrency(loc.profit),
      `${margin}%`
    ];
  });
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `location_profitability_${dateStr}`);
}

// Machine Exports
export function exportMachinePerformance(data: ReportsData, dateStr: string): void {
  const headers = ["Machine", "Location", "Type", "Total Plays", "Prizes Won", "True Win Rate", "Expected Win Rate", "Status"];
  const rows = data.machinePerformance.map(machine => [
    machine.custom_label || machine.machine_type,
    machine.locationName,
    machine.machine_type,
    machine.totalPlays.toFixed(0),
    machine.totalPrizes.toString(),
    `${(machine.trueWinRate * 100).toFixed(2)}%`,
    `${(machine.expectedWinRate * 100).toFixed(2)}%`,
    machine.performance
  ]);
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `machine_performance_${dateStr}`);
}

export function exportHotColdAnalysis(data: ReportsData, dateStr: string): void {
  const headers = ["Machine", "Location", "True Odds", "Expected Odds", "Variance", "Status", "Recommendation"];
  const rows = data.machinePerformance.map(machine => {
    const trueOdds = machine.trueWinRate > 0 ? (1 / machine.trueWinRate).toFixed(1) : "N/A";
    const expectedOdds = machine.expectedWinRate > 0 ? (1 / machine.expectedWinRate).toFixed(1) : "N/A";
    const variance = ((machine.trueWinRate - machine.expectedWinRate) * 100).toFixed(2);
    const recommendation = machine.performance === "hot" ? "Consider tightening" : 
                          machine.performance === "cold" ? "Consider loosening" : "No adjustment needed";
    return [
      machine.custom_label || machine.machine_type,
      machine.locationName,
      `1 in ${trueOdds}`,
      `1 in ${expectedOdds}`,
      `${variance}%`,
      machine.performance.charAt(0).toUpperCase() + machine.performance.slice(1),
      recommendation
    ];
  });
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `hot_cold_analysis_${dateStr}`);
}

// Financial Exports
export function exportFinancialSummary(data: ReportsData, dateStr: string): void {
  const headers = ["Type", "Amount"];
  const profitMargin = data.financialSummary.totalIncome > 0 
    ? (data.financialSummary.netProfit / data.financialSummary.totalIncome) * 100 
    : 0;
  const rows = [
    ["Total Income", formatCurrency(data.financialSummary.totalIncome)],
    ["Total Expenses", formatCurrency(data.financialSummary.totalExpenses)],
    ["Net Profit", formatCurrency(data.financialSummary.netProfit)],
    ["Profit Margin", `${profitMargin.toFixed(1)}%`]
  ];
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `financial_summary_${dateStr}`);
}

export function exportExpenseCategories(data: ReportsData, dateStr: string): void {
  const headers = ["Category", "Amount", "Percentage"];
  const expenseEntries = Object.entries(data.financialSummary.expensesByCategory);
  const total = expenseEntries.reduce((sum, [, amount]) => sum + amount, 0);
  const rows = expenseEntries.map(([category, amount]) => [
    category,
    formatCurrency(amount),
    `${total > 0 ? ((amount / total) * 100).toFixed(1) : 0}%`
  ]);
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `expense_categories_${dateStr}`);
}

// Inventory Exports
export function exportInventoryStatus(data: ReportsData, dateStr: string): void {
  const headers = ["Item", "Category", "Quantity", "Min Stock", "Price", "Value", "Status"];
  const rows = data.inventoryItems.map(item => {
    const qty = item.quantity || 0;
    const minStock = item.min_stock || 5;
    const price = item.price_per_item || 0;
    const value = qty * price;
    const status = qty <= 0 ? "Out of Stock" : qty <= minStock ? "Low" : "OK";
    return [
      item.name,
      item.category || "Uncategorized",
      qty.toString(),
      minStock.toString(),
      formatCurrency(price),
      formatCurrency(value),
      status
    ];
  });
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `inventory_status_${dateStr}`);
}

export function exportStockUsage(data: ReportsData, dateStr: string): void {
  const headers = ["Item", "Total Used", "Times Restocked", "Avg Per Restock"];
  const rows = data.inventoryAnalysis.productUsage.map(item => [
    item.name,
    item.totalUsed.toString(),
    item.runCount.toString(),
    item.runCount > 0 ? (item.totalUsed / item.runCount).toFixed(1) : "0"
  ]);
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `stock_usage_${dateStr}`);
}

export function exportLowStockItems(data: ReportsData, dateStr: string): void {
  const headers = ["Item", "Current Qty", "Min Stock", "Shortage", "Restock Cost"];
  const rows = data.inventoryAnalysis.lowStockItems.map(item => {
    const qty = item.quantity || 0;
    const minStock = item.min_stock || 5;
    const shortage = Math.max(0, minStock - qty);
    const price = item.price_per_item || 0;
    const restockCost = shortage * price;
    return [
      item.name,
      qty.toString(),
      minStock.toString(),
      shortage.toString(),
      formatCurrency(restockCost)
    ];
  });
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `low_stock_items_${dateStr}`);
}

// Routes Exports
export function exportMileageLog(data: ReportsData, dateStr: string): void {
  const headers = ["Date", "From", "To", "Miles", "Purpose", "Vehicle"];
  const rows = data.filteredData.mileageEntries.map(entry => {
    const vehicle = data.vehicles.find(v => v.id === entry.vehicle_id);
    return [
      format(new Date(entry.date), "yyyy-MM-dd"),
      entry.start_location,
      entry.end_location,
      Number(entry.miles).toFixed(1),
      entry.purpose || "N/A",
      vehicle?.name || "N/A"
    ];
  });
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `mileage_log_${dateStr}`);
}

export function exportVehicleSummary(data: ReportsData, dateStr: string): void {
  const headers = ["Vehicle", "Total Miles", "Trip Count", "Avg Miles/Trip"];
  const rows = data.mileageAnalysis.milesByVehicle.map(v => [
    v.name,
    v.miles.toFixed(1),
    v.trips.toString(),
    v.trips > 0 ? (v.miles / v.trips).toFixed(1) : "0"
  ]);
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `vehicle_summary_${dateStr}`);
}

export function exportMilesByPurpose(data: ReportsData, dateStr: string): void {
  const headers = ["Purpose", "Total Miles", "Tax Deduction"];
  const purposeEntries = Object.entries(data.mileageAnalysis.milesByPurpose);
  const rows = purposeEntries.map(([purpose, miles]) => [
    purpose,
    miles.toFixed(1),
    formatCurrency(miles * 0.67)
  ]);
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `miles_by_purpose_${dateStr}`);
}

// Win Rate Exports
export function exportWinRateByMachine(data: ReportsData, dateStr: string): void {
  const headers = ["Machine", "Location", "Total Plays", "Prizes Won", "Win Rate", "True Odds", "Expected Odds", "Performance"];
  const rows = data.machinePerformance.map(machine => {
    const trueOdds = machine.trueWinRate > 0 ? (1 / machine.trueWinRate).toFixed(1) : "N/A";
    const expectedOdds = machine.expectedWinRate > 0 ? (1 / machine.expectedWinRate).toFixed(1) : "N/A";
    return [
      machine.custom_label || machine.machine_type,
      machine.locationName,
      machine.totalPlays.toFixed(0),
      machine.totalPrizes.toString(),
      `${(machine.trueWinRate * 100).toFixed(2)}%`,
      `1 in ${trueOdds}`,
      `1 in ${expectedOdds}`,
      machine.performance.charAt(0).toUpperCase() + machine.performance.slice(1)
    ];
  });
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `win_rate_by_machine_${dateStr}`);
}

export function exportWinRateByLocation(data: ReportsData, dateStr: string): void {
  const headers = ["Location", "Total Plays", "Total Prizes", "Avg Win Rate", "Status"];
  
  const rows = data.winRateAnalysis.winRateByLocation.map(loc => {
    const winRatePercent = loc.winRate * 100;
    const status = winRatePercent > 15 ? "Running Hot" : winRatePercent < 10 ? "Running Tight" : "Normal";
    return [
      loc.locationName,
      loc.plays.toFixed(0),
      loc.prizes.toString(),
      `${winRatePercent.toFixed(2)}%`,
      status
    ];
  });
  
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `win_rate_by_location_${dateStr}`);
}

export type ExportType = 
  | "location_breakdown" | "top_locations" | "location_profit"
  | "machine_performance" | "hot_cold_analysis"
  | "financial_summary" | "expense_categories"
  | "inventory_status" | "stock_usage" | "low_stock"
  | "mileage_log" | "vehicle_summary" | "miles_by_purpose"
  | "win_rate_machines" | "win_rate_locations";

export function handleExport(exportType: ExportType, data: ReportsData, dateStr: string): void {
  switch (exportType) {
    case "location_breakdown":
      exportLocationBreakdown(data, dateStr);
      break;
    case "top_locations":
      exportTopLocations(data, dateStr);
      break;
    case "location_profit":
      exportLocationProfitability(data, dateStr);
      break;
    case "machine_performance":
      exportMachinePerformance(data, dateStr);
      break;
    case "hot_cold_analysis":
      exportHotColdAnalysis(data, dateStr);
      break;
    case "financial_summary":
      exportFinancialSummary(data, dateStr);
      break;
    case "expense_categories":
      exportExpenseCategories(data, dateStr);
      break;
    case "inventory_status":
      exportInventoryStatus(data, dateStr);
      break;
    case "stock_usage":
      exportStockUsage(data, dateStr);
      break;
    case "low_stock":
      exportLowStockItems(data, dateStr);
      break;
    case "mileage_log":
      exportMileageLog(data, dateStr);
      break;
    case "vehicle_summary":
      exportVehicleSummary(data, dateStr);
      break;
    case "miles_by_purpose":
      exportMilesByPurpose(data, dateStr);
      break;
    case "win_rate_machines":
      exportWinRateByMachine(data, dateStr);
      break;
    case "win_rate_locations":
      exportWinRateByLocation(data, dateStr);
      break;
  }
}
