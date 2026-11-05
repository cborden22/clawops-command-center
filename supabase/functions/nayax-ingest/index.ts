// Ingests Nayax transaction report CSVs.
// Two ways in:
//  1) Signed-in user uploads a CSV from Settings (Authorization: Bearer <jwt>, JSON { csv }).
//  2) Inbound-email webhook (Postmark / Mailgun / CloudMailin / Zapier) posts the hourly
//     report to ?token=<ingest_token>. Accepts raw CSV, multipart attachments, or JSON attachments.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MAX_BYTES = 10 * 1024 * 1024;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  const t = text.replace(/^\uFEFF/, "");
  const delim = (t.split("\n")[0].match(/;/g)?.length ?? 0) > (t.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ALIASES: Record<string, string[]> = {
  txId: ["transactionid", "transactionnumber", "txid", "transid", "trxid", "nayaxtransactionid", "transactionidnayaxinternalidentifier", "authorizationretrievalreferencenumber", "pspstransactionid", "paymentserviceprovidertransactionid"],
  machineId: ["machineid", "nayaxmachineid", "devicemachineid", "operatoridentifier", "terminalid", "deviceid"],
  machineName: ["machinename", "machine", "machinedescription"],
  amount: ["sevalue", "settlementvalue", "settlementamount", "payedvalue", "amount", "authorizationvalue", "value", "price", "totalamount"],
  method: ["paymentmethod", "paymentmethoddescription", "paymentmethoddescr", "paymenttype", "recognitiondescription", "recognitionmethod"],
  date: ["authorizationdatetimegmt", "authorizationdatetime", "authorizationdateandtime", "authorizationtime", "setime", "machineautime", "machineauthorizationtime", "settlementtime", "machinesetime", "settlementdatetimegmt", "transactiondate", "datetime", "date"],
  brand: ["cardbrand", "brand", "cardtype"],
};

function parseDate(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})[ T]?(\d{1,2})?:?(\d{2})?:?(\d{2})?\s*(AM|PM)?/i);
  if (m) {
    let h = Number(m[4] ?? 0);
    if (m[7]) { const pm = m[7].toUpperCase() === "PM"; if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
    const d = new Date(Date.UTC(+m[3], +m[1] - 1, +m[2], h, Number(m[5] ?? 0), Number(m[6] ?? 0)));
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : s.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function mapRows(rows: string[][]) {
  if (rows.length < 2) throw new Error("The file has no transaction rows.");
  // Excel exports often have title/filter rows above the real header — find it.
  const findIdx = (header: string[]) => {
    const idx: Record<string, number> = {};
    for (const [k, al] of Object.entries(ALIASES)) {
      for (const a of al) { const i = header.indexOf(a); if (i >= 0) { idx[k] = i; break; } }
    }
    return idx;
  };
  let hRow = 0, idx: Record<string, number> = {}, best = -1;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const cand = findIdx(rows[i].map(norm));
    const score = Object.keys(cand).length + (cand.amount !== undefined && cand.date !== undefined ? 10 : 0);
    if (score > best) { best = score; hRow = i; idx = cand; }
  }
  for (const req of ["amount", "date"]) {
    if (idx[req] === undefined) throw new Error(`Could not find a "${req === "amount" ? "SeValue / Settlement Value" : "Authorization Time"}" column. Columns found: ${rows[hRow].filter(Boolean).slice(0, 15).join(", ")}`);
  }
  const header0 = rows[hRow];
  const out = [] as any[];
  let skipped = 0;
  for (const r of rows.slice(hRow + 1)) {
    const get = (k: string) => (idx[k] !== undefined ? (r[idx[k]] ?? "").trim() : "");
    // No Transaction ID column? Build a stable one so re-uploads don't double count.
    const tx = get("txId") || (get("date") ? `gen:${get("machineId")}|${get("date")}|${get("amount")}|${get("method")}` : "");
    const date = parseDate(get("date"));
    const amount = Number(get("amount").replace(/[^0-9.\-]/g, ""));
    if (!tx || !date || !isFinite(amount)) { skipped++; continue; }
    const raw: Record<string, string> = {};
    header0.forEach((h, i) => (raw[h] = r[i] ?? ""));
    out.push({
      nayax_transaction_id: tx, transaction_date: date, amount,
      nayax_machine_id: get("machineId") || null, machine_name: get("machineName") || null,
      payment_method: get("method") || null, card_brand: get("brand") || null, raw_data: raw,
    });
  }
  return { out, skipped };
}

async function extractCsvs(req: Request): Promise<string[]> {
  const ct = req.headers.get("content-type") ?? "";
  const b64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
  const isCsvName = (n?: string) => !n || /\.(csv|txt)$/i.test(n);
  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const res: string[] = [];
    for (const [, v] of fd.entries()) if (v instanceof File && isCsvName(v.name)) res.push(await v.text());
    return res;
  }
  if (ct.includes("application/json")) {
    const body = await req.json();
    if (typeof body?.csv === "string") return [body.csv];
    const atts = body?.Attachments ?? body?.attachments ?? [];
    return (Array.isArray(atts) ? atts : [])
      .filter((a: any) => isCsvName(a.Name ?? a.name ?? a.file_name ?? a.filename))
      .map((a: any) => b64(a.Content ?? a.content ?? a.content_base64 ?? ""))
      .filter(Boolean);
  }
  return [await req.text()];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) return json({ error: "File too large" }, 413);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  let userId: string | null = null;
  let trigger = "upload";

  if (token) {
    if (token.length < 24) return json({ error: "Invalid token" }, 401);
    const { data } = await admin.from("nayax_settings").select("user_id").eq("ingest_token", token).maybeSingle();
    if (!data) return json({ error: "Invalid token" }, 401);
    userId = data.user_id; trigger = "email";
  } else {
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { data, error } = await admin.auth.getUser(auth);
    if (error || !data.user) return json({ error: "Unauthorized" }, 401);
    const { data: owner } = await admin.rpc("get_effective_owner_id", { current_user_id: data.user.id });
    userId = (owner as string) ?? data.user.id;
  }

  const { data: runRow } = await admin.from("nayax_sync_runs")
    .insert({ user_id: userId, trigger, status: "running" }).select("id").single();
  const finish = (patch: Record<string, unknown>) =>
    admin.from("nayax_sync_runs").update({ ...patch, finished_at: new Date().toISOString() }).eq("id", runRow!.id);

  try {
    const csvs = await extractCsvs(req);
    if (!csvs.length) throw new Error("No CSV file was found in the request.");

    const { data: machines } = await admin.from("location_machines")
      .select("id, nayax_machine_id, locations!inner(user_id)")
      .eq("locations.user_id", userId).not("nayax_machine_id", "is", null);
    const byNayax = new Map((machines ?? []).map((m: any) => [String(m.nayax_machine_id).trim(), m.id]));

    let rows: any[] = [], skipped = 0;
    for (const c of csvs) { const r = mapRows(parseCsv(c)); rows = rows.concat(r.out); skipped += r.skipped; }
    const dedup = new Map(rows.map((r) => [r.nayax_transaction_id, r]));
    const payload = [...dedup.values()].map((r) => ({
      ...r, user_id: userId, machine_id: r.nayax_machine_id ? byNayax.get(r.nayax_machine_id) ?? null : null,
      synced_at: new Date().toISOString(),
    }));

    for (let i = 0; i < payload.length; i += 500) {
      const { error } = await admin.from("nayax_transactions")
        .upsert(payload.slice(i, i + 500), { onConflict: "nayax_transaction_id" });
      if (error) throw new Error(error.message);
    }
    const matched = new Set(payload.filter((p) => p.machine_id).map((p) => p.machine_id));
    const total = payload.reduce((s, p) => s + p.amount, 0);
    const dates = payload.map((p) => p.transaction_date).sort();
    const unmatched = payload.filter((p) => !p.machine_id).length;

    await finish({
      status: skipped || unmatched ? "partial" : "success", rows_upserted: payload.length, machines_checked: matched.size,
      error: [skipped ? `${skipped} rows skipped (missing ID, date, or amount)` : "", unmatched ? `${unmatched} sales didn't match a machine's Nayax ID` : ""].filter(Boolean).join(". ") || null,
    });
    await admin.from("nayax_settings").upsert({ user_id: userId, is_connected: true, last_sync: new Date().toISOString() }, { onConflict: "user_id" });
    if (matched.size) await admin.from("location_machines").update({ last_nayax_sync: new Date().toISOString() }).in("id", [...matched]);

    return json({ rows: payload.length, machines: matched.size, skipped, unmatched, total, from: dates[0] ?? null, to: dates.at(-1) ?? null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Import failed";
    await finish({ status: "failed", error: msg });
    return json({ error: msg }, 400);
  }
});
