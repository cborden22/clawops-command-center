import { useMemo, useState } from "react";
import { format, differenceInCalendarDays, parseISO, isWithinInterval } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { HandCoins, CheckCircle2, Clock, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { StatCard } from "@/components/shared/StatCard";
import { ReportCard } from "./ReportCard";
import type { ReportsData } from "@/hooks/useReportsData";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (d: string) => {
  try { return format(parseISO(d), "MMM d, yyyy"); } catch { return d; }
};

export function CommissionPayoutReport({ data }: { data: ReportsData }) {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { allCommissionSummaries, locations, dateRange } = data;

  const locMap = useMemo(
    () => new Map((locations as any[]).map((l) => [l.id, l])),
    [locations]
  );

  const { outstanding, outstandingTotal, paidInRange, paidInRangeTotal, owedAll, paidAll, historyGroups } =
    useMemo(() => {
      const all = allCommissionSummaries as any[];
      const amt = (c: any) => Number(c.commission_amount || 0);
      const outstanding = all
        .filter((c) => !c.commission_paid && amt(c) > 0)
        .sort((a, b) => a.end_date.localeCompare(b.end_date));
      const paid = all.filter((c) => c.commission_paid);
      const paidInRange = paid
        .filter((c) => {
          const d = c.commission_paid_at || c.end_date;
          try { return isWithinInterval(parseISO(d), { start: dateRange.start, end: dateRange.end }); }
          catch { return false; }
        })
        .sort((a, b) => (b.commission_paid_at || b.end_date).localeCompare(a.commission_paid_at || a.end_date));
      const groups = new Map<string, { name: string; contact: string; total: number; rows: any[] }>();
      paidInRange.forEach((c) => {
        const l: any = locMap.get(c.location_id);
        const g = groups.get(c.location_id) || { name: l?.name ?? "Unknown location", contact: l?.contact_person ?? "", total: 0, rows: [] };
        g.total += amt(c);
        g.rows.push(c);
        groups.set(c.location_id, g);
      });
      return {
        outstanding,
        outstandingTotal: outstanding.reduce((s, c) => s + amt(c), 0),
        paidInRange,
        paidInRangeTotal: paidInRange.reduce((s, c) => s + amt(c), 0),
        owedAll: all.reduce((s, c) => s + amt(c), 0),
        paidAll: paid.reduce((s, c) => s + amt(c), 0),
        historyGroups: [...groups.values()].sort((a, b) => b.total - a.total),
      };
    }, [allCommissionSummaries, dateRange, locMap]);

  const markPaid = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase
      .from("commission_summaries")
      .update({ commission_paid: true, commission_paid_at: new Date().toISOString() })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast({ title: "Couldn't mark as paid", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Marked as paid" });
    qc.invalidateQueries({ queryKey: ["reports-commissions"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <HandCoins className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Commission Payouts</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Still to pay out" value={fmt(outstandingTotal)} hint={`${outstanding.length} statements`} icon={Clock} tone="warning" />
        <StatCard label="Paid this period" value={fmt(paidInRangeTotal)} hint={`${paidInRange.length} payouts`} icon={CheckCircle2} tone="success" />
        <StatCard label="Total owed (all time)" value={fmt(owedAll)} icon={HandCoins} />
        <StatCard label="Total paid (all time)" value={fmt(paidAll)} icon={History} tone="info" />
      </div>

      <ReportCard title="Remaining to Pay Out" icon={Clock}>
        {outstanding.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">You're all caught up — nothing owed.</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="text-left border-b border-border">
                  <th className="p-2">Location</th>
                  <th className="p-2">Period</th>
                  <th className="p-2 text-right">Revenue</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Owed</th>
                  <th className="p-2 text-right">Age</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {outstanding.map((c: any) => {
                  const l: any = locMap.get(c.location_id);
                  const age = differenceInCalendarDays(new Date(), parseISO(c.end_date));
                  return (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="p-2">
                        <div className="font-medium">{l?.name ?? "Unknown"}</div>
                        {l?.contact_person && <div className="text-xs text-muted-foreground">{l.contact_person}</div>}
                      </td>
                      <td className="p-2 whitespace-nowrap">{fmtDate(c.start_date)} – {fmtDate(c.end_date)}</td>
                      <td className="p-2 text-right tabular-nums">{fmt(Number(c.total_revenue || 0))}</td>
                      <td className="p-2 text-right tabular-nums">{Number(c.commission_percentage || 0).toFixed(1)}%</td>
                      <td className="p-2 text-right tabular-nums font-semibold">{fmt(Number(c.commission_amount || 0))}</td>
                      <td className="p-2 text-right">
                        <Badge variant={age > 30 ? "destructive" : "secondary"}>{Math.max(age, 0)}d</Badge>
                      </td>
                      <td className="p-2 text-right">
                        <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => markPaid(c.id)}>
                          Mark paid
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ReportCard>

      <ReportCard title="Payout History (selected period)" icon={History}>
        {historyGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No payouts in this period.</p>
        ) : (
          <div className="space-y-4">
            {historyGroups.map((g) => (
              <div key={g.name} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{g.name}</div>
                    {g.contact && <div className="text-xs text-muted-foreground">Paid to {g.contact}</div>}
                  </div>
                  <div className="font-semibold tabular-nums text-success">{fmt(g.total)}</div>
                </div>
                <div className="space-y-1">
                  {g.rows.map((c: any) => (
                    <div key={c.id} className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                      <span>{fmtDate(c.start_date)} – {fmtDate(c.end_date)}</span>
                      <span>
                        Paid {c.commission_paid_at ? fmtDate(c.commission_paid_at) : "—"} ·{" "}
                        <span className="text-foreground tabular-nums">{fmt(Number(c.commission_amount || 0))}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ReportCard>
    </div>
  );
}
