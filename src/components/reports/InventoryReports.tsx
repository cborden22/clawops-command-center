import { Package, AlertTriangle, TrendingUp, DollarSign, RefreshCw, RotateCcw } from "lucide-react";
import { ReportCard, ReportListItem } from "./ReportCard";
import { useReportsData } from "@/hooks/useReportsData";

interface InventoryReportsProps {
  data: ReturnType<typeof useReportsData>;
}

export function InventoryReports({ data }: InventoryReportsProps) {
  const { inventoryAnalysis, inventoryItems } = data;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const topUsedProducts = inventoryAnalysis.productUsage.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportCard
          title="Total Items"
          icon={Package}
          metric={inventoryAnalysis.totalItems}
          metricLabel="In inventory"
        />
        <ReportCard
          title="Low Stock"
          icon={AlertTriangle}
          metric={inventoryAnalysis.lowStockCount}
          metricLabel="Items need restock"
          trend={inventoryAnalysis.lowStockCount > 0 ? "down" : "up"}
          trendValue={inventoryAnalysis.lowStockCount > 0 ? "Alert" : "OK"}
        />
        <ReportCard
          title="Inventory Value"
          icon={DollarSign}
          metric={formatCurrency(inventoryAnalysis.totalValue)}
          metricLabel="Current stock value"
        />
        <ReportCard
          title="Stock Runs"
          icon={RefreshCw}
          metric={inventoryAnalysis.stockRunCount}
          metricLabel="This period"
        />
      </div>

      {/* Detailed Reports */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Most Used Products */}
        <ReportCard
          title="Most Used Products"
          icon={TrendingUp}
        >
          {topUsedProducts.length > 0 ? (
            <div className="space-y-1">
              {topUsedProducts.map((product, idx) => (
                <ReportListItem
                  key={product.name}
                  rank={idx + 1}
                  label={product.name}
                  value={`${product.totalUsed} used`}
                  subValue={`${product.runCount} runs`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No stock run history
            </p>
          )}
        </ReportCard>

        {/* Low Stock Alerts */}
        <ReportCard
          title="Low Stock Alerts"
          icon={AlertTriangle}
        >
          {inventoryAnalysis.lowStockItems.length > 0 ? (
            <div className="space-y-1">
              {inventoryAnalysis.lowStockItems.slice(0, 5).map((item) => (
                <ReportListItem
                  key={item.id}
                  icon={AlertTriangle}
                  status="warning"
                  label={item.name}
                  value={`${item.quantity || 0} left`}
                  subValue={`Min: ${item.min_stock || 5}`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              All items are stocked adequately
            </p>
          )}
        </ReportCard>

        {/* Restock Cost */}
        <ReportCard
          title="Restock Estimate"
          icon={DollarSign}
        >
          <div className="py-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(inventoryAnalysis.restockCost)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              To bring all items to optimal level
            </p>
          </div>
        </ReportCard>

        {/* Full Inventory Table */}
        <ReportCard
          title="Inventory Status"
          icon={Package}
          className="lg:col-span-3"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Item</th>
                  <th className="text-left py-2 font-medium">Category</th>
                  <th className="text-right py-2 font-medium">Quantity</th>
                  <th className="text-right py-2 font-medium">Min Stock</th>
                  <th className="text-right py-2 font-medium">Price/Item</th>
                  <th className="text-right py-2 font-medium">Value</th>
                  <th className="text-center py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => {
                  const isLowStock = (item.quantity || 0) <= (item.min_stock || 5);
                  const value = (item.quantity || 0) * (Number(item.price_per_item) || 0);
                  return (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 font-medium">{item.name}</td>
                      <td className="py-2 text-muted-foreground">{item.category || "—"}</td>
                      <td className="text-right py-2">{item.quantity || 0}</td>
                      <td className="text-right py-2 text-muted-foreground">{item.min_stock || 5}</td>
                      <td className="text-right py-2">{formatCurrency(Number(item.price_per_item) || 0)}</td>
                      <td className="text-right py-2 font-semibold">{formatCurrency(value)}</td>
                      <td className="text-center py-2">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-600">
                            <AlertTriangle className="h-3 w-3" /> Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {inventoryItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No inventory items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>
      </div>
    </div>
  );
}
