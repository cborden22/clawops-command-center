import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-api-token, content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });
const isCash = (m: string | null) => !!m && /cash|coin|bill/i.test(m);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("NAYAX_API_TOKEN") ?? "";
  const given = req.headers.get("x-api-token") ?? "";
  if (!expected || !given || !safeEqual(given, expected)) return json({ error: "Unauthorized" }, 401);

  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id") ?? "";
  const from = Number(url.searchParams.get("from"));
  const to = Number(url.searchParams.get("to"));
  if (!UUID.test(userId)) return json({ error: "Invalid user_id" }, 400);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return json({ error: "Invalid from/to" }, 400);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const fromIso = new Date(from * 1000).toISOString();
  const toIso = new Date(to * 1000).toISOString();

  const days = new Map<string, { date: string; gross: number; count: number; card: number; cash: number }>();
  const transactions: unknown[] = [];
  const page = 1000;
  for (let off = 0; ; off += page) {
    const { data, error } = await sb
      .from("nayax_transactions")
      .select("nayax_transaction_id, transaction_date, amount, payment_method, machine_name")
      .eq("user_id", userId)
      .gte("transaction_date", fromIso)
      .lte("transaction_date", toIso)
      .order("transaction_date", { ascending: false })
      .range(off, off + page - 1);
    if (error) { console.error(error); return json({ error: "Query failed" }, 500); }
    for (const t of data ?? []) {
      const date = dayFmt.format(new Date(t.transaction_date));
      const cents = Math.round(Number(t.amount) * 100);
      const cash = isCash(t.payment_method);
      const d = days.get(date) ?? { date, gross: 0, count: 0, card: 0, cash: 0 };
      d.gross += cents; d.count += 1;
      if (cash) d.cash += cents; else d.card += cents;
      days.set(date, d);
      if (transactions.length < 500) transactions.push({
        id: t.nayax_transaction_id, date, amount: cents,
        payment_method: cash ? "cash" : "card", machine_name: t.machine_name,
      });
    }
    if (!data || data.length < page) break;
  }
  return json({ days: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)), transactions });
});
