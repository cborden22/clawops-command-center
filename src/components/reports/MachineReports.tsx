import { Cpu, TrendingUp, TrendingDown, Flame, Snowflake, Target } from "lucide-react";
import { ReportCard, ReportListItem } from "./ReportCard";
import { useReportsData } from "@/hooks/useReportsData";

interface MachineReportsProps {
  data: ReturnType<typeof useReportsData>;
}

export function MachineReports({ data }: MachineReportsProps) {
  const { machinePerformance, winRateAnalysis } = data;

  const topMachines = machinePerformance.slice(0, 5);
  const hotMachines = machinePerformance.filter(m => m.performance === "hot");
  const coldMachines = machinePerformance.filter(m => m.performance === "cold");

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount * 0.25);

  const formatOdds = (odds: number) => 
    odds > 0 ? `1 in ${odds.toFixed(1)}` : "N/A";

  const formatPercent = (rate: number) => 
    `${(rate * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportCard
          title="Total Machines"
          icon={Cpu}
          metric={machinePerformance.length}
          metricLabel="Across all locations"
        />
        <ReportCard
          title="Avg Win Rate"
          icon={Target}
          metric={formatPercent(winRateAnalysis.overallWinRate)}
          metricLabel={`Odds: ${formatOdds(winRateAnalysis.overallOdds)}`}
        />
        <ReportCard
          title="Hot Machines"
          icon={Flame}
          metric={hotMachines.length}
          metricLabel="Paying over expected"
        />
        <ReportCard
          title="Cold Machines"
          icon={Snowflake}
          metric={coldMachines.length}
          metricLabel="Paying under expected"
        />
      </div>

      {/* Detailed Reports */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Performing Machines */}
        <ReportCard
          title="Top Earning Machines"
          icon={TrendingUp}
        >
          {topMachines.length > 0 ? (
            <div className="space-y-1">
              {topMachines.map((machine, idx) => (
                <ReportListItem
                  key={machine.id}
                  rank={idx + 1}
                  label={machine.custom_label || machine.machine_type}
                  value={formatCurrency(machine.totalCoins)}
                  subValue={machine.locationName}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No machine data for this period
            </p>
          )}
        </ReportCard>

        {/* Hot Machines */}
        <ReportCard
          title="Hot Machines (Overpaying)"
          icon={Flame}
        >
          {hotMachines.length > 0 ? (
            <div className="space-y-1">
              {hotMachines.slice(0, 5).map((machine) => (
                <ReportListItem
                  key={machine.id}
                  icon={Flame}
                  status="warning"
                  label={machine.custom_label || machine.machine_type}
                  value={formatOdds(machine.trueOdds)}
                  subValue={`Expected: ${formatOdds(Number(machine.win_probability) || 0)}`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hot machines detected
            </p>
          )}
        </ReportCard>

        {/* Cold Machines */}
        <ReportCard
          title="Cold Machines (Underpaying)"
          icon={Snowflake}
        >
          {coldMachines.length > 0 ? (
            <div className="space-y-1">
              {coldMachines.slice(0, 5).map((machine) => (
                <ReportListItem
                  key={machine.id}
                  icon={Snowflake}
                  status="info"
                  label={machine.custom_label || machine.machine_type}
                  value={formatOdds(machine.trueOdds)}
                  subValue={`Expected: ${formatOdds(Number(machine.win_probability) || 0)}`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No cold machines detected
            </p>
          )}
        </ReportCard>

        {/* Machine Performance Table */}
        <ReportCard
          title="Machine Performance Details"
          icon={Cpu}
          className="lg:col-span-3"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Machine</th>
                  <th className="text-left py-2 font-medium">Location</th>
                  <th className="text-right py-2 font-medium">Revenue</th>
                  <th className="text-right py-2 font-medium">Plays</th>
                  <th className="text-right py-2 font-medium">Prizes</th>
                  <th className="text-right py-2 font-medium">True Odds</th>
                  <th className="text-right py-2 font-medium">Expected</th>
                  <th className="text-center py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {machinePerformance.map((machine) => (
                  <tr key={machine.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 font-medium">{machine.custom_label || machine.machine_type}</td>
                    <td className="py-2 text-muted-foreground">{machine.locationName}</td>
                    <td className="text-right py-2">{formatCurrency(machine.totalCoins)}</td>
                    <td className="text-right py-2">{machine.totalPlays.toFixed(0)}</td>
                    <td className="text-right py-2">{machine.totalPrizes}</td>
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
                          Normal
                        </span>
                      )}
                      {machine.performance === "unknown" && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {machinePerformance.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No machine data available
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
