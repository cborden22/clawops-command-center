import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const etHour = () =>
  Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(new Date()));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = Deno.env.get("NAYAX_LYNX_TOKEN");

  // Determine mode
  let ownerFilter: string | null = null;
  let trigger = "manual";
  const cronHeader = req.headers.get("x-cron-secret");
  if (cronHeader) {
    const { data } = await admin.from("nayax_cron_config").select("secret").eq("id", 1).maybeSingle();
    if (!data || data.secret !== cronHeader) return json({ error: "Unauthorized" }, 401);
    // Cron fires at 06:00 and 07:00 UTC; only proceed at 2 AM Eastern (DST-safe)
    if (etHour() !== 2) return json({ skipped: true });
    trigger = "cron";
  } else {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data, error } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (error || !data?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const { data: owner } = await admin.rpc("get_effective_owner_id", { current_user_id: data.claims.sub });
    ownerFilter = (owner as string) ?? data.claims.sub;
  }

  if (!token) return json({ error: "Nayax token is not configured." }, 500);

  // Load machines with Nayax IDs
  let q = admin
    .from("location_machines")
    .select("id, nayax_machine_id, locations!location_machines_location_id_fkey(user_id)")
    .not("nayax_machine_id", "is", null)
    .neq("nayax_machine_id", "");
  const { data: machines, error: mErr } = await q;
  if (mErr) return json({ error: mErr.message }, 500);

  const list = (machines ?? [])
    .map((m: any) => ({ id: m.id, nayaxId: String(m.nayax_machine_id).trim(), owner: m.locations?.user_id as string }))
    .filter((m) => m.owner && (!ownerFilter || m.owner === ownerFilter));

  // One run record per owner
  const owners = [...new Set(list.map((m) => m.owner))];
  if (ownerFilter && !owners.includes(ownerFilter)) owners.push(ownerFilter);
  const runIds: Record<string, string> = {};
  for (const o of owners) {
    const { data } = await admin.from("nayax_sync_runs").insert({ user_id: o, trigger }).select("id").single();
    if (data) runIds[o] = data.id;
  }

  const stats: Record<string, { rows: number; machines: number; errors: string[] }> = {};
  owners.forEach((o) => (stats[o] = { rows: 0, machines: 0, errors: [] }));

  for (const m of list) {
    const s = stats[m.owner];
    s.machines++;
    try {
      const res = await fetch(
        `https://lynx.nayax.com/operational/v1/machines/${encodeURIComponent(m.nayaxId)}/lastSales`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
      );
      if (!res.ok) {
        s.errors.push(`Machine ${m.nayaxId}: HTTP ${res.status}`);
        await res.body?.cancel();
        continue;
      }
      const payload = await res.json();
      const sales: any[] = Array.isArray(payload) ? payload : payload?.data ?? payload?.Sales ?? [];
      const rows = sales
        .filter((t) => t?.TransactionID != null)
        .map((t) => ({
          user_id: m.owner,
          machine_id: m.id,
          nayax_transaction_id: String(t.TransactionID),
          nayax_machine_id: t.MachineID != null ? String(t.MachineID) : m.nayaxId,
          machine_name: t.MachineName ?? null,
          amount: Number(t.SettlementValue ?? 0),
          payment_method: t.PaymentMethod ?? null,
          card_brand: t.CardBrand ?? null,
          transaction_date: t.AuthorizationDateTimeGMT
            ? new Date(String(t.AuthorizationDateTimeGMT).endsWith("Z") ? t.AuthorizationDateTimeGMT : `${t.AuthorizationDateTimeGMT}Z`).toISOString()
            : new Date().toISOString(),
          raw_data: t,
          synced_at: new Date().toISOString(),
        }));
      if (rows.length) {
        const { error } = await admin.from("nayax_transactions").upsert(rows, { onConflict: "nayax_transaction_id" });
        if (error) { s.errors.push(`Machine ${m.nayaxId}: ${error.message}`); continue; }
        s.rows += rows.length;
      }
      await admin.from("location_machines").update({ last_nayax_sync: new Date().toISOString() }).eq("id", m.id);
    } catch (e) {
      s.errors.push(`Machine ${m.nayaxId}: ${(e as Error).message}`);
    }
  }

  const now = new Date().toISOString();
  for (const o of owners) {
    const s = stats[o];
    const status = s.errors.length === 0 ? "success" : s.rows > 0 || s.errors.length < s.machines ? "partial" : "failed";
    await admin.from("nayax_sync_runs").update({
      status, rows_upserted: s.rows, machines_checked: s.machines,
      error: s.errors.length ? s.errors.slice(0, 10).join("; ") : null, finished_at: now,
    }).eq("id", runIds[o]);
    await admin.from("nayax_settings").upsert({ user_id: o, last_sync: now, is_connected: true }, { onConflict: "user_id" });
  }

  const mine = ownerFilter ? stats[ownerFilter] : null;
  return json(mine ? { rows: mine.rows, machines: mine.machines, errors: mine.errors } : { owners: owners.length });
});
