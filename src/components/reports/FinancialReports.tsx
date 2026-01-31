import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Receipt, Wallet } from "lucide-react";
import { ReportCard, ReportListItem } from "./ReportCard";
import { useReportsData } from "@/hooks/useReportsData";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface FinancialReportsProps {
  data: ReturnType<typeof useReportsData>;
}

const COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#22c55e', '#ec4899', '#6366f1'];

export function FinancialReports({ data }: FinancialReportsProps) {
  const { financialSummary, locationPerformance } = data;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const expenseData = Object.entries(financialSummary.expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const profitMargin = financialSummary.totalIncome > 0 
    ? ((financialSummary.netProfit / financialSummary.totalIncome) * 100).toFixed(1)
    : "0";

  const locationProfits = locationPerformance
    .filter(l => l.income > 0)
    .sort((a, b) => b.profit - a.profit);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportCard
          title="Total Income"
          icon={TrendingUp}
          metric={formatCurrency(financialSummary.totalIncome)}
          metricLabel={`${financialSummary.entryCount} entries`}
          trend="up"
          trendValue={formatCurrency(financialSummary.totalIncome)}
        />
        <ReportCard
          title="Total Expenses"
          icon={TrendingDown}
          metric={formatCurrency(financialSummary.totalExpenses)}
          metricLabel={`${Object.keys(financialSummary.expensesByCategory).length} categories`}
          trend="down"
          trendValue={formatCurrency(financialSummary.totalExpenses)}
        />
        <ReportCard
          title="Net Profit"
          icon={PiggyBank}
          metric={formatCurrency(financialSummary.netProfit)}
          metricLabel={`${profitMargin}% margin`}
          trend={financialSummary.netProfit >= 0 ? "up" : "down"}
          trendValue={`${profitMargin}%`}
        />
        <ReportCard
          title="Avg per Location"
          icon={Wallet}
          metric={formatCurrency(
            locationPerformance.length > 0 
              ? financialSummary.netProfit / locationPerformance.length 
              : 0
          )}
          metricLabel="Net profit per location"
        />
      </div>

      {/* Detailed Reports */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Expense Breakdown Chart */}
        <ReportCard
          title="Expense Breakdown"
          icon={Receipt}
          className="lg:col-span-1"
        >
          {expenseData.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {expenseData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend 
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No expenses recorded
            </p>
          )}
        </ReportCard>

        {/* Expense Categories List */}
        <ReportCard
          title="Expenses by Category"
          icon={DollarSign}
        >
          {expenseData.length > 0 ? (
            <div className="space-y-1">
              {expenseData
                .sort((a, b) => b.value - a.value)
                .slice(0, 6)
                .map((cat, idx) => (
                  <ReportListItem
                    key={cat.name}
                    rank={idx + 1}
                    label={cat.name}
                    value={formatCurrency(cat.value)}
                    subValue={`${((cat.value / financialSummary.totalExpenses) * 100).toFixed(1)}%`}
                  />
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No expense data available
            </p>
          )}
        </ReportCard>

        {/* Profit by Location */}
        <ReportCard
          title="Profit by Location"
          icon={PiggyBank}
        >
          {locationProfits.length > 0 ? (
            <div className="space-y-1">
              {locationProfits.slice(0, 5).map((loc, idx) => (
                <ReportListItem
                  key={loc.id}
                  rank={idx + 1}
                  label={loc.name}
                  value={formatCurrency(loc.profit)}
                  subValue={`${((loc.profit / loc.income) * 100).toFixed(1)}% margin`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No profit data available
            </p>
          )}
        </ReportCard>

        {/* Financial Summary Table */}
        <ReportCard
          title="Income & Expense Summary"
          icon={Wallet}
          className="lg:col-span-3"
        >
          <div className="grid md:grid-cols-3 gap-6 py-4">
            <div className="text-center p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="text-sm text-muted-foreground mb-1">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(financialSummary.totalIncome)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(financialSummary.totalExpenses)}
              </p>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              financialSummary.netProfit >= 0 
                ? 'bg-primary/5 border border-primary/20'
                : 'bg-red-500/5 border border-red-500/20'
            }`}>
              <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
              <p className={`text-2xl font-bold ${
                financialSummary.netProfit >= 0 ? 'text-primary' : 'text-red-600'
              }`}>
                {formatCurrency(financialSummary.netProfit)}
              </p>
            </div>
          </div>
        </ReportCard>
      </div>
    </div>
  );
}
