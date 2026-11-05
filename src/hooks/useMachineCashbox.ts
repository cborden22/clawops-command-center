import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CashboxStats {
  since: string | null;
  cash: number;
  cashVends: number;
  card: number;
  cardVends: number;
  total: number;
}

export const isCashMethod = (m?: string | null) => (m || "").toLowerCase().includes("cash");

/**
 * Expected cashbox per machine = Nayax cash sales since the machine's last cash collection.
 * Card/total are shown over the same window for context.
 */
export function useMachineCashbox(machineIds: string[]) {
  const [stats, setStats] = useState<Record<string, CashboxStats>>({});
  const [loading, setLoading] = useState(false);
  const key = machineIds.slice().sort().join(",");

  const load = useCallback(async () => {
    if (!machineIds.length) { setStats({}); return; }
    setLoading(true);
    try {
      const { data: ms } = await supabase
        .from("location_machines")
        .select("id, cash_collected_at")
        .in("id", machineIds);
      const sinceMap = new Map((ms || []).map((m) => [m.id, m.cash_collected_at as string | null]));
      const oldest = [...sinceMap.values()].some((v) => !v)
        ? null
        : [...sinceMap.values()].sort()[0] ?? null;

      let q = supabase
        .from("nayax_transactions")
        .select("machine_id, amount, payment_method, transaction_date")
        .in("machine_id", machineIds)
        .limit(10000);
      if (oldest) q = q.gt("transaction_date", oldest);
      const { data: tx } = await q;

      const out: Record<string, CashboxStats> = {};
      machineIds.forEach((id) => {
        out[id] = { since: sinceMap.get(id) ?? null, cash: 0, cashVends: 0, card: 0, cardVends: 0, total: 0 };
      });
      (tx || []).forEach((t) => {
        const s = t.machine_id ? out[t.machine_id] : undefined;
        if (!s) return;
        if (s.since && t.transaction_date <= s.since) return;
        const amt = Number(t.amount) || 0;
        if (isCashMethod(t.payment_method)) { s.cash += amt; s.cashVends++; }
        else { s.card += amt; s.cardVends++; }
        s.total += amt;
      });
      setStats(out);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { load(); }, [load]);

  const resetCashbox = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase
      .from("location_machines")
      .update({ cash_collected_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw error;
    await load();
  }, [load]);

  return { stats, loading, reload: load, resetCashbox };
}
