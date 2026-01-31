

## Comprehensive Business Reports Tab

### Overview
Create a new **Reports** section with multiple report categories to give business owners complete visibility into their claw machine operations. This will be the central hub for analyzing performance, identifying trends, and making data-driven decisions.

---

### Report Categories

We will organize reports into logical categories with tabs for easy navigation:

#### 1. Location Performance Reports
| Report | Description | Data Source |
|--------|-------------|-------------|
| **Top Performing Locations** | Ranked by total revenue | revenue_entries |
| **Worst Performing Locations** | Lowest revenue locations | revenue_entries |
| **Location Profitability** | Revenue minus expenses per location | revenue_entries |
| **Location Growth Trends** | Month-over-month revenue change | revenue_entries |
| **Commission Analysis** | Total commissions paid per location | commission_summaries |

#### 2. Machine Performance Reports
| Report | Description | Data Source |
|--------|-------------|-------------|
| **Top Performing Machines** | Best revenue per machine | revenue_entries + location_machines |
| **Machine Win Rate Analysis** | True win rate by machine | machine_collections |
| **Machines Running Hot/Cold** | Over/under paying vs expected | machine_collections |
| **Machine Type Comparison** | Claw vs Mini Claw vs Bulk performance | location_machines + revenue |
| **Prize Efficiency** | Prizes dispensed per dollar earned | machine_collections |

#### 3. Financial Reports
| Report | Description | Data Source |
|--------|-------------|-------------|
| **Income vs Expense Summary** | Total income/expenses by period | revenue_entries |
| **Profit Margins** | Net profit by location and overall | revenue_entries |
| **Expense Breakdown** | Expenses by category (prizes, fuel, maintenance) | revenue_entries |
| **Revenue Trends** | Weekly/monthly revenue over time | revenue_entries |
| **Projected Earnings** | Based on historical averages | revenue_entries |

#### 4. Inventory Reports
| Report | Description | Data Source |
|--------|-------------|-------------|
| **Most Used Products** | Items with highest consumption | stock_run_history |
| **Low Stock Alert Summary** | All items below threshold | inventory_items |
| **Inventory Value** | Total value of current inventory | inventory_items |
| **Restock Cost Estimate** | Cost to bring all items to optimal level | inventory_items |
| **Product Turnover Rate** | How fast items are being used | stock_run_history |
| **Return Rate Analysis** | Items frequently returned from runs | stock_run_history |

#### 5. Mileage / Routes Reports
| Report | Description | Data Source |
|--------|-------------|-------------|
| **Total Miles Driven** | By period with IRS deduction | mileage_entries |
| **Miles by Purpose** | Collection runs vs restocks vs other | mileage_entries |
| **Most Visited Locations** | Frequency of visits | mileage_entries |
| **Vehicle Usage Summary** | Miles per vehicle | mileage_entries + vehicles |
| **Route Efficiency** | Average miles per location visited | mileage_entries |

#### 6. Collection Reports (Win Rate Deep Dive)
| Report | Description | Data Source |
|--------|-------------|-------------|
| **Overall Win Rate** | Aggregate across all machines | machine_collections |
| **Win Rate by Location** | Which locations run tight/loose | machine_collections |
| **Win Rate Trends** | Is win rate improving over time? | machine_collections |
| **Collection History** | All collections with metrics | machine_collections |

---

### UI Design

**Tab-Based Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Business Reports                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  [Locations] [Machines] [Financial] [Inventory] [Routes] [Win Rate] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─ Date Range ────────────────────┐  ┌─ Export ───────────────┐    │
│  │ [This Month ▼] [01/01 - 01/31]  │  │ [Download CSV] [Print] │    │
│  └─────────────────────────────────┘  └────────────────────────┘    │
│                                                                      │
│  ┌─ Report Cards ───────────────────────────────────────────────┐   │
│  │                                                               │   │
│  │  [Report Card 1]  [Report Card 2]  [Report Card 3]           │   │
│  │                                                               │   │
│  │  [Report Card 4]  [Report Card 5]  [Report Card 6]           │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Each Report Card Shows:**
- Title and icon
- Key metric (large number)
- Supporting data (chart or list)
- "View Details" expansion option

---

### Technical Implementation

#### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Reports.tsx` | Main reports page with tab navigation |
| `src/components/reports/LocationReports.tsx` | Location performance reports |
| `src/components/reports/MachineReports.tsx` | Machine performance reports |
| `src/components/reports/FinancialReports.tsx` | Financial analysis reports |
| `src/components/reports/InventoryReports.tsx` | Inventory usage reports |
| `src/components/reports/RoutesReports.tsx` | Mileage and route reports |
| `src/components/reports/WinRateReports.tsx` | Collection/win rate analysis |
| `src/components/reports/ReportCard.tsx` | Reusable report card component |
| `src/components/reports/DateRangeFilter.tsx` | Date range picker for filtering |
| `src/hooks/useReportsData.ts` | Custom hook for aggregating report data |

#### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/reports` route |
| `src/components/layout/AppSidebar.tsx` | Add "Reports" nav item |
| `src/components/layout/MobileBottomNav.tsx` | Add "Reports" to More menu |

---

### Key Calculations

**Location Profitability:**
```typescript
const locationProfit = locations.map(loc => {
  const income = entries.filter(e => e.locationId === loc.id && e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const expenses = entries.filter(e => e.locationId === loc.id && e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const commissions = loc.commissionSummaries
    .reduce((sum, c) => sum + c.commissionAmount, 0);
  return { ...loc, income, expenses, commissions, profit: income - expenses - commissions };
});
```

**Machine Performance:**
```typescript
const machinePerformance = machines.map(machine => {
  const collections = allCollections.filter(c => c.machineId === machine.id);
  const totalPlays = collections.reduce((sum, c) => sum + (c.coinsInserted * 0.25 / machine.costPerPlay), 0);
  const totalPrizes = collections.reduce((sum, c) => sum + c.prizesWon, 0);
  const trueWinRate = totalPlays > 0 ? totalPrizes / totalPlays : 0;
  return { ...machine, totalPlays, totalPrizes, trueWinRate };
});
```

**Inventory Consumption:**
```typescript
const productUsage = stockRunHistory.reduce((acc, run) => {
  run.items.forEach(item => {
    if (!acc[item.id]) acc[item.id] = { name: item.name, totalUsed: 0, runCount: 0 };
    acc[item.id].totalUsed += item.quantity;
    acc[item.id].runCount++;
  });
  return acc;
}, {});
```

---

### Date Range Filtering

All reports will support date range filtering with presets:
- Today
- This Week
- This Month (default)
- Last Month
- This Quarter
- This Year
- All Time
- Custom Range

---

### Export Capabilities

- **CSV Export**: Download filtered report data as CSV
- **Print View**: Printable summary for record-keeping

---

### Mobile Considerations

- Reports tab accessible from More menu on mobile
- Cards stack vertically on mobile
- Horizontal scroll for tables
- Bottom sheet for filters on mobile

---

### Navigation Placement

Add to sidebar between "Routes" and "Inventory Tracker":

```typescript
{ title: "Reports", url: "/reports", icon: BarChart3 }
```

---

### Summary Stats for Each Tab

**Locations Tab Header:**
- Total Locations: X
- Total Revenue: $X
- Top Performer: [Name]

**Machines Tab Header:**
- Total Machines: X
- Avg Win Rate: X%
- Hot Machines: X | Cold Machines: X

**Financial Tab Header:**
- This Month Income: $X
- This Month Expenses: $X
- Net Profit: $X

**Inventory Tab Header:**
- Total Items: X
- Low Stock: X items
- Inventory Value: $X

**Routes Tab Header:**
- Total Miles: X
- Tax Deduction: $X
- Trips This Month: X

**Win Rate Tab Header:**
- Overall Win Rate: X%
- Avg Odds: 1 in X
- Total Collections: X

