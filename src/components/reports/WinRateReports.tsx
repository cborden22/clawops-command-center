import { Target, TrendingUp, Flame, Snowflake, BarChart3, MapPin } from "lucide-react";
import { ReportCard, ReportListItem } from "./ReportCard";
import { useReportsData } from "@/hooks/useReportsData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface WinRateReportsProps {
  data: ReturnType<typeof useReportsData>;
}

export function WinRateReports({ data }: WinRateReportsProps) {
  const { winRateAnalysis, machinePerformance } = data;

  const formatPercent = (rate: number) => `${(rate * 100).toFixed(2)}%`;
  const formatOdds = (odds: number) => odds > 0 ? `1 in ${odds.toFixed(1)}` : "N/A";

  const locationWinRateData = winRateAnalysis.winRateByLocation.slice(0, 8).map(loc => ({
    name: loc.locationName.length > 12 ? loc.locationName.substring(0, 12) + "..." : loc.locationName,
    winRate: loc.winRate * 100,
    odds: loc.odds,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportCard
          title="Overall Win Rate"
          icon={Target}
          metric={formatPercent(winRateAnalysis.overallWinRate)}
          metricLabel={`Odds: ${formatOdds(winRateAnalysis.overallOdds)}`}
        />
        <ReportCard
          title="Total Collections"
          icon={BarChart3}
          metric={winRateAnalysis.totalCollections}
          metricLabel={`${winRateAnalysis.totalPrizes} prizes won`}
        />
        <ReportCard
          title="Hot Machines"
          icon={Flame}
          metric={winRateAnalysis.hotMachines}
          metricLabel="Paying over expected"
          trend={winRateAnalysis.hotMachines > 0 ? "down" : "neutral"}
          trendValue={winRateAnalysis.hotMachines > 0 ? "Watch" : "OK"}
        />
        <ReportCard
          title="Cold Machines"
          icon={Snowflake}
          metric={winRateAnalysis.coldMachines}
          metricLabel="Paying under expected"
          trend={winRateAnalysis.coldMachines > 0 ? "up" : "neutral"}
          trendValue={winRateAnalysis.coldMachines > 0 ? "Adjust" : "OK"}
        />
      </div>

      {/* Detailed Reports */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Win Rate by Location Chart */}
        <ReportCard
          title="Win Rate by Location"
          icon={MapPin}
          className="lg:col-span-2"
        >
          {locationWinRateData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationWinRateData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 'auto']} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Win Rate']}
                  />
                  <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                    {locationWinRateData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.winRate > 12 ? '#f59e0b' : entry.winRate > 10 ? '#22c55e' : '#3b82f6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No collection data available
            </p>
          )}
        </ReportCard>

        {/* Win Rate Rankings */}
        <ReportCard
          title="Location Win Rate Rankings"
          icon={TrendingUp}
        >
          {winRateAnalysis.winRateByLocation.length > 0 ? (
            <div className="space-y-1">
              {winRateAnalysis.winRateByLocation.slice(0, 5).map((loc, idx) => (
                <ReportListItem
                  key={loc.locationId}
                  rank={idx + 1}
                  label={loc.locationName}
                  value={formatOdds(loc.odds)}
                  subValue={`${loc.prizes} prizes / ${loc.plays.toFixed(0)} plays`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No win rate data
            </p>
          )}
        </ReportCard>

        {/* Machine Performance Table */}
        <ReportCard
          title="Machine Win Rate Details"
          icon={Target}
          className="lg:col-span-3"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Machine</th>
                  <th className="text-left py-2 font-medium">Location</th>
                  <th className="text-right py-2 font-medium">Plays</th>
                  <th className="text-right py-2 font-medium">Prizes</th>
                  <th className="text-right py-2 font-medium">Win Rate</th>
                  <th className="text-right py-2 font-medium">True Odds</th>
                  <th className="text-right py-2 font-medium">Expected</th>
                  <th className="text-center py-2 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {machinePerformance.filter(m => m.collectionCount > 0).map((machine) => (
                  <tr key={machine.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 font-medium">{machine.custom_label || machine.machine_type}</td>
                    <td className="py-2 text-muted-foreground">{machine.locationName}</td>
                    <td className="text-right py-2">{machine.totalPlays.toFixed(0)}</td>
                    <td className="text-right py-2">{machine.totalPrizes}</td>
                    <td className="text-right py-2">{formatPercent(machine.trueWinRate)}</td>
                    <td className="text-right py-2 font-mono">{formatOdds(machine.trueOdds)}</td>
                    <td className="text-right py-2 font-mono text-muted-foreground">
                      {formatOdds(Number(machine.win_probability) || 0)}
                    </td>
                    <td className="text-center py-2">
                      {machine.performance === "hot" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/10 text-orange-600">
                          <Flame className="h-3 w-3" /> Hot
                        </span>
                      )}
                      {machine.performance === "cold" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-600">
                          <Snowflake className="h-3 w-3" /> Cold
                        </span>
                      )}
                      {machine.performance === "normal" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600">
                          Optimal
                        </span>
                      )}
                      {machine.performance === "unknown" && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {machinePerformance.filter(m => m.collectionCount > 0).length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No collection data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>

        {/* Win Rate Guidance */}
        <ReportCard
          title="Win Rate Benchmarks"
          icon={Target}
          className="lg:col-span-3"
        >
          <div className="grid md:grid-cols-3 gap-4 py-4">
            <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="font-semibold text-orange-600">Very Generous</span>
              </div>
              <p className="text-2xl font-bold">1 in 7-8</p>
              <p className="text-xs text-muted-foreground mt-1">
                Customers win frequently. May reduce profitability.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-green-600">Optimal</span>
              </div>
              <p className="text-2xl font-bold">1 in 8-9</p>
              <p className="text-xs text-muted-foreground mt-1">
                Balanced for player satisfaction and profit.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Snowflake className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-blue-600">Tight</span>
              </div>
              <p className="text-2xl font-bold">1 in 10+</p>
              <p className="text-xs text-muted-foreground mt-1">
                Higher profit but may reduce repeat plays.
              </p>
            </div>
          </div>
        </ReportCard>
      </div>
    </div>
  );
}
