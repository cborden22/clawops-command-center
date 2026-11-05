// Pulls Nayax transaction report CSVs out of the connected Gmail inbox and
// hands them to nayax-ingest. Manual: signed-in user (JWT). Hourly cron: body {cron:true},
// imports for the account that most recently ran a manual Gmail check.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GW = "https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me";
const LABEL = "ClawOps-Imported";
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function gmail(path: string, init: RequestInit = {}) {
  const res = await fetch(`${GW}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": Deno.env.get("GOOGLE_MAIL_API_KEY")!,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Gmail [${res.status}]: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

const b64urlDecode = (s: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

function csvParts(part: any, out: { name: string; id?: string; data?: string }[] = []) {
  if (part?.filename && /\.(csv|txt)$/i.test(part.filename)) {
    out.push({ name: part.filename, id: part.body?.attachmentId, data: part.body?.data });
  }
  for (const p of part?.parts ?? []) csvParts(p, out);
  return out;
}

function bodies(part: any, out: string[] = []) {
  if (part?.mimeType?.startsWith("text/") && part.body?.data && !part.filename) out.push(b64urlDecode(part.body.data));
  for (const p of part?.parts ?? []) bodies(p, out);
  return out;
}

// Only trust Nayax's own report download links.
function reportLinks(payload: any): string[] {
  const links = new Set<string>();
  for (const html of bodies(payload)) {
    const clean = html.replace(/=\r?\n/g, "").replace(/&amp;/g, "&");
    for (const m of clean.matchAll(/https:\/\/my\.nayax\.com\/core\/reports\/download\?file=[A-Za-z0-9_\-%.~]+/g)) links.add(m[0]);
  }
  return [...links];
}

async function labelId(): Promise<string> {
  const { labels } = await gmail("/labels");
  const hit = (labels ?? []).find((l: any) => l.name === LABEL);
  if (hit) return hit.id;
  const made = await gmail("/labels", { method: "POST", body: JSON.stringify({ name: LABEL }) });
  return made.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(() => ({}));

  let userId: string | null = null;
  const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
  const { data: u } = auth ? await admin.auth.getUser(auth) : { data: { user: null } };
  if (u?.user) {
    const { data: owner } = await admin.rpc("get_effective_owner_id", { current_user_id: u.user.id });
    userId = (owner as string) ?? u.user.id;
  } else if (body?.cron === true) {
    const { data } = await admin.from("nayax_sync_runs").select("user_id")
      .eq("trigger", "gmail").order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return json({ skipped: "No account has connected Gmail import yet." });
    userId = data.user_id;
  } else return json({ error: "Unauthorized" }, 401);

  // Make sure this account has an ingest token so nayax-ingest can attribute the sales.
  let { data: s } = await admin.from("nayax_settings").select("ingest_token").eq("user_id", userId).maybeSingle();
  let token = (s as any)?.ingest_token as string | null;
  if (!token) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
    await admin.from("nayax_settings").upsert({ user_id: userId, ingest_token: token }, { onConflict: "user_id" });
  }

  const { data: run } = await admin.from("nayax_sync_runs")
    .insert({ user_id: userId, trigger: "gmail", status: "running" }).select("id").single();
  const finish = (p: Record<string, unknown>) =>
    admin.from("nayax_sync_runs").update({ ...p, finished_at: new Date().toISOString() }).eq("id", run!.id);

  try {
    const lid = await labelId();
    const q = `(from:notifier@nayax.com OR subject:"Nayax Transactions Report") -label:${LABEL} newer_than:14d`;
    const list = await gmail(`/messages?maxResults=25&q=${encodeURIComponent(q)}`);
    const ids: string[] = (list.messages ?? []).map((m: any) => m.id);

    let emails = 0, rows = 0, machines = 0, total = 0;
    const errors: string[] = [];
    for (const id of ids) {
      const msg = await gmail(`/messages/${id}?format=full`);
      const files: { name: string; csv: string }[] = [];
      for (const p of csvParts(msg.payload)) {
        const data = p.data ?? (p.id ? (await gmail(`/messages/${id}/attachments/${p.id}`)).data : null);
        if (data) files.push({ name: p.name, csv: b64urlDecode(data) });
      }
      // Nayax usually sends a "Report" download link instead of an attachment.
      if (!files.length) {
        for (const link of reportLinks(msg.payload)) {
          const res = await fetch(link);
          const text = await res.text();
          if (!res.ok || /<html/i.test(text.slice(0, 500))) {
            errors.push(`Report link could not be downloaded (${res.status}) — it may have expired.`);
            continue;
          }
          files.push({ name: "Nayax report link", csv: text });
        }
      }
      if (!files.length) continue;
      let ok = true;
      for (const p of files) {
        const r = await fetch(`${url}/functions/v1/nayax-ingest?token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv: p.csv }),
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok) { ok = false; errors.push(`${p.name}: ${out.error ?? r.status}`); continue; }
        rows += out.rows ?? 0; machines = Math.max(machines, out.machines ?? 0); total += out.total ?? 0;
      }
      if (ok) {
        emails++;
        await gmail(`/messages/${id}/modify`, { method: "POST", body: JSON.stringify({ addLabelIds: [lid] }) });
      }
    }
    await finish({
      status: errors.length ? (emails ? "partial" : "failed") : "success",
      rows_upserted: rows, machines_checked: machines,
      error: errors.length ? errors.join(". ").slice(0, 1000) : (ids.length ? null : "No new Nayax report emails found."),
    });
    return json({ emails, rows, machines, total, errors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gmail check failed";
    await finish({ status: "failed", error: msg });
    return json({ error: msg }, 500);
  }
});
