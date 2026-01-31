

## Enhanced CSV Export with Report Selection

### Overview
Replace the simple "Export CSV" button with a dropdown menu that allows users to select which specific report(s) they want to export. Each report tab will have multiple exportable datasets, giving users granular control over their data exports.

---

### Current State
- Single "Export CSV" button that logs to console
- No actual CSV generation implemented
- Cannot select which report to export

---

### Solution

Transform the Export CSV button into a dropdown menu with organized report options. Each tab's data will be exportable with meaningful filenames and properly formatted CSV content.

---

### Export Options by Tab

| Tab | Exportable Reports |
|-----|-------------------|
| **Locations** | Location Breakdown, Top Performers, Profitability |
| **Machines** | Machine Performance, Hot/Cold Analysis |
| **Financial** | Income/Expense Summary, Expense by Category, Profit by Location |
| **Inventory** | Inventory Status, Stock Usage, Low Stock Items |
| **Routes** | Mileage Log, Miles by Purpose, Vehicle Usage |
| **Win Rate** | Win Rate by Machine, Win Rate by Location |

---

### UI Design

**Dropdown Menu Structure:**
```
┌─────────────────────────────────────┐
│ [Export CSV ▼]                      │
├─────────────────────────────────────┤
│ Locations                           │
│   ├ Location Breakdown              │
│   ├ Top Performers                  │
│   └ Profitability Report            │
├─────────────────────────────────────┤
│ Machines                            │
│   ├ Machine Performance             │
│   └ Hot/Cold Analysis               │
├─────────────────────────────────────┤
│ Financial                           │
│   ├ Income & Expenses               │
│   └ Expense Categories              │
├─────────────────────────────────────┤
│ Inventory                           │
│   ├ Inventory Status                │
│   └ Stock Usage                     │
├─────────────────────────────────────┤
│ Routes                              │
│   ├ Mileage Log                     │
│   └ Vehicle Summary                 │
├─────────────────────────────────────┤
│ Win Rate                            │
│   ├ Machine Win Rates               │
│   └ Location Win Rates              │
└─────────────────────────────────────┘
```

---

### Technical Implementation

#### Files to Modify

| File | Changes |
|------|---------|
| `src/components/reports/DateRangeFilter.tsx` | Replace button with dropdown, add export options |
| `src/pages/Reports.tsx` | Pass report data to filter, add export handler with report type |

#### Files to Create

| File | Purpose |
|------|---------|
| `src/utils/csvExport.ts` | Utility functions for generating and downloading CSV files |

---

### Export Data Structures

**1. Location Breakdown CSV:**
```csv
Location,Revenue,Expenses,Commission,Profit,Machines
Pizza Palace,$1500.00,$200.00,$150.00,$1150.00,3
Game Zone,$1200.00,$150.00,$120.00,$930.00,2
```

**2. Machine Performance CSV:**
```csv
Machine,Location,Revenue,Plays,Prizes,True Odds,Expected Odds,Status
Claw #1,Pizza Palace,$375.00,150,18,1 in 8.3,1 in 8,Normal
Mini Claw #2,Game Zone,$200.00,80,12,1 in 6.7,1 in 8,Hot
```

**3. Financial Summary CSV:**
```csv
Type,Category,Amount
Income,Machine Revenue,$2700.00
Expense,Prizes,$350.00
Expense,Fuel,$120.00
```

**4. Inventory Status CSV:**
```csv
Item,Category,Quantity,Min Stock,Price,Value,Status
Plush Bear,Plush,25,10,$2.50,$62.50,OK
Small Prize,Capsule,3,5,$0.50,$1.50,Low
```

**5. Mileage Log CSV:**
```csv
Date,From,To,Miles,Purpose,Vehicle,Odometer Start,Odometer End
2026-01-31,Warehouse,Pizza Palace,23.5,Collection Run,Work Van,45230,45253.5
```

**6. Win Rate by Machine CSV:**
```csv
Machine,Location,Plays,Prizes,Win Rate,True Odds,Expected Odds,Performance
Claw #1,Pizza Palace,150,18,12.00%,1 in 8.3,1 in 8,Normal
```

---

### CSV Utility Functions

```typescript
// src/utils/csvExport.ts

export function generateCSV(headers: string[], rows: string[][]): string {
  const headerRow = headers.join(",");
  const dataRows = rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  );
  return [headerRow, ...dataRows].join("\n");
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
```

---

### DateRangeFilter Changes

Replace the simple button with a DropdownMenu:

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Export CSV
      <ChevronDown className="h-4 w-4 ml-2" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>Locations</DropdownMenuLabel>
    <DropdownMenuItem onClick={() => onExport("location_breakdown")}>
      Location Breakdown
    </DropdownMenuItem>
    // ... more items
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Export Handler in Reports.tsx

```typescript
type ExportType = 
  | "location_breakdown" | "top_locations" | "location_profit"
  | "machine_performance" | "hot_cold_analysis"
  | "financial_summary" | "expense_categories"
  | "inventory_status" | "stock_usage" | "low_stock"
  | "mileage_log" | "vehicle_summary" | "miles_by_purpose"
  | "win_rate_machines" | "win_rate_locations";

const handleExportCSV = (exportType: ExportType) => {
  const dateStr = format(dateRange.start, "yyyy-MM-dd") + "_" + format(dateRange.end, "yyyy-MM-dd");
  
  switch (exportType) {
    case "location_breakdown":
      exportLocationBreakdown(reportData, dateStr);
      break;
    case "machine_performance":
      exportMachinePerformance(reportData, dateStr);
      break;
    // ... etc
  }
};
```

---

### File Naming Convention

Exported files will include the date range for easy identification:

```
location_breakdown_2026-01-01_2026-01-31.csv
machine_performance_2026-01-01_2026-01-31.csv
mileage_log_2026-01-01_2026-01-31.csv
```

---

### Mobile Considerations

The dropdown menu works well on mobile with:
- Touch-friendly menu items
- Adequate spacing for finger taps
- Scrollable content if many options

---

### Summary of Changes

1. **Create `src/utils/csvExport.ts`** with CSV generation and download utilities
2. **Update `DateRangeFilter.tsx`** to use dropdown menu with categorized export options
3. **Update `Reports.tsx`** to handle export by type and generate appropriate CSV data

This gives users complete control over exactly what data they export, with properly formatted CSVs that include all relevant columns and data from the selected date range.

