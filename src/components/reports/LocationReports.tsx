import { MapPin, TrendingUp, TrendingDown, DollarSign, Building2 } from "lucide-react";
import { ReportCard, ReportListItem } from "./ReportCard";
import { useReportsData } from "@/hooks/useReportsData";

interface LocationReportsProps {
  data: ReturnType<typeof useReportsData>;
}

export function LocationReports({ data }: LocationReportsProps) {
  const { locationPerformance, financialSummary, filteredData } = data;

  const topLocations = locationPerformance.slice(0, 5);
  const worstLocations = [...locationPerformance].sort((a, b) => a.income - b.income).slice(0, 5);
  const mostProfitable = [...locationPerformance].sort((a, b) => b.profit - a.profit).slice(0, 5);

  const totalRevenue = locationPerformance.reduce((sum, l) => sum + l.income, 0);
  const totalCommissions = filteredData.commissionSummaries.reduce(
    (sum, c) => sum + Number(c.commission_amount || 0), 0
  );

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportCard
          title="Total Locations"
          icon={Building2}
          metric={locationPerformance.length}
          metricLabel="Active locations"
        />
        <ReportCard
          title="Total Revenue"
          icon={DollarSign}
          metric={formatCurrency(totalRevenue)}
          metricLabel="From all locations"
        />
        <ReportCard
          title="Top Performer"
          icon={TrendingUp}
          metric={topLocations[0]?.name || "N/A"}
          metricLabel={topLocations[0] ? formatCurrency(topLocations[0].income) : "No data"}
        />
        <ReportCard
          title="Total Commissions"
          icon={MapPin}
          metric={formatCurrency(totalCommissions)}
          metricLabel={`${filteredData.commissionSummaries.length} payouts`}
        />
      </div>

      {/* Detailed Reports */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Performing Locations */}
        <ReportCard
          title="Top Performing Locations"
          icon={TrendingUp}
          className="lg:col-span-1"
        >
          {topLocations.length > 0 ? (
            <div className="space-y-1">
              {topLocations.map((loc, idx) => (
                <ReportListItem
                  key={loc.id}
                  rank={idx + 1}
                  label={loc.name}
                  value={formatCurrency(loc.income)}
                  subValue={`${loc.machineCount} machines`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No location data for this period
            </p>
          )}
        </ReportCard>

        {/* Worst Performing Locations */}
        <ReportCard
          title="Lowest Performing Locations"
          icon={TrendingDown}
          className="lg:col-span-1"
        >
          {worstLocations.length > 0 ? (
            <div className="space-y-1">
              {worstLocations.map((loc, idx) => (
                <ReportListItem
                  key={loc.id}
                  rank={idx + 1}
                  label={loc.name}
                  value={formatCurrency(loc.income)}
                  subValue={loc.income === 0 ? "No revenue" : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No location data for this period
            </p>
          )}
        </ReportCard>

        {/* Most Profitable */}
        <ReportCard
          title="Most Profitable Locations"
          icon={DollarSign}
          className="lg:col-span-1"
        >
          {mostProfitable.length > 0 ? (
            <div className="space-y-1">
              {mostProfitable.map((loc, idx) => (
                <ReportListItem
                  key={loc.id}
                  rank={idx + 1}
                  label={loc.name}
                  value={formatCurrency(loc.profit)}
                  subValue={`Revenue: ${formatCurrency(loc.income)}`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No profitability data available
            </p>
          )}
        </ReportCard>

        {/* Location Breakdown Table */}
        <ReportCard
          title="Location Breakdown"
          icon={MapPin}
          className="lg:col-span-3"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Location</th>
                  <th className="text-right py-2 font-medium">Revenue</th>
                  <th className="text-right py-2 font-medium">Expenses</th>
                  <th className="text-right py-2 font-medium">Commission</th>
                  <th className="text-right py-2 font-medium">Profit</th>
                  <th className="text-right py-2 font-medium">Machines</th>
                </tr>
              </thead>
              <tbody>
                {locationPerformance.map((loc) => (
                  <tr key={loc.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 font-medium">{loc.name}</td>
                    <td className="text-right py-2 text-green-600">{formatCurrency(loc.income)}</td>
                    <td className="text-right py-2 text-red-600">{formatCurrency(loc.expenses)}</td>
                    <td className="text-right py-2 text-orange-600">{formatCurrency(loc.commissions)}</td>
                    <td className={`text-right py-2 font-semibold ${loc.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(loc.profit)}
                    </td>
                    <td className="text-right py-2">{loc.machineCount}</td>
                  </tr>
                ))}
                {locationPerformance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No location data available
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
