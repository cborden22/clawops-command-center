import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, CreditCard, Copy, RefreshCw, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Run = {
  status: string;
  rows_upserted: number;
  machines_checked: number;
  error: string | null;
  started_at: string;
  finished_at: string | null;
  trigger: string;
};

const statusVariant = (s: string) =>
  s === "success" ? "default" : s === "failed" ? "destructive" : "secondary";

const newToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");

const FN_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/nayax-ingest`;

export function NayaxSyncCard() {
  const { user } = useAuth();
  const [run, setRun] = useState<Run | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [{ data: r }, { data: s }] = await Promise.all([
      supabase.from("nayax_sync_runs")
        .select("status, rows_upserted, machines_checked, error, started_at, finished_at, trigger")
        .order("started_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("nayax_settings").select("ingest_token").maybeSingle(),
    ]);
    setRun(r as Run | null);
    setToken((s as any)?.ingest_token ?? null);
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (!user) return;
    const t = newToken();
    const { error } = await supabase.from("nayax_settings")
      .upsert({ user_id: user.id, ingest_token: t } as any, { onConflict: "user_id" });
    if (error) return toast({ title: "Couldn't create address", description: error.message, variant: "destructive" });
    setToken(t);
    toast({ title: "Report link ready", description: "Any old link stops working." });
  };

  const upload = async (file: File) => {
    if (!/\.(csv|txt)$/i.test(file.name)) {
      return toast({ title: "Please choose a CSV file", variant: "destructive" });
    }
    if (file.size > 10 * 1024 * 1024) return toast({ title: "File is over 10 MB", variant: "destructive" });
    setBusy(true);
    const csv = await file.text();
    const { data, error } = await supabase.functions.invoke("nayax-ingest", { body: { csv } });
    setBusy(false);
    await load();
    if (error || data?.error) {
      let msg = data?.error;
      try { msg = msg ?? (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
      return toast({ title: "Import failed", description: msg ?? "Please check the file and try again.", variant: "destructive" });
    }
    toast({
      title: `Imported ${data.rows} sales`,
      description: `$${Number(data.total).toFixed(2)} across ${data.machines} machines${data.unmatched ? ` · ${data.unmatched} unmatched` : ""}.`,
    });
  };

  const hookUrl = token ? `${FN_URL}?token=${token}` : "";

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Nayax Sales Reports
        </CardTitle>
        <CardDescription>
          Bring in card sales from Nayax transaction report CSVs — upload one any time, or have Nayax email it hourly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">Last import:</span>
          <span className="font-medium">
            {run ? new Date(run.finished_at ?? run.started_at).toLocaleString() : "Never"}
          </span>
          {run && <Badge variant={statusVariant(run.status)} className="capitalize">{run.status}</Badge>}
        </div>
        {run && (
          <p className="text-sm text-muted-foreground">
            {run.rows_upserted} sales matched to {run.machines_checked} machines ({run.trigger === "email" ? "hourly email" : "upload"})
          </p>
        )}
        {run?.error && <p className="text-sm text-destructive break-words">{run.error}</p>}

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"}`}
        >
          {busy ? <RefreshCw className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
          <p className="text-sm font-medium">{busy ? "Importing..." : "Drop a Nayax CSV here or tap to choose"}</p>
          <p className="text-xs text-muted-foreground">Duplicate sales are skipped automatically.</p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-primary" /> Hourly email reports</p>
          {token ? (
            <>
              <div className="flex gap-2">
                <Input readOnly value={hookUrl} className="font-mono text-xs" onKeyDown={(e) => e.stopPropagation()} />
                <Button variant="outline" size="icon" aria-label="Copy link"
                  onClick={() => { navigator.clipboard.writeText(hookUrl); toast({ title: "Copied" }); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Schedule an hourly Transactions report (CSV) in Nayax Core, send it to an inbound-email service
                (Postmark, Mailgun, CloudMailin or Zapier Email Parser), and have that service post the email to this link.
                Keep it private — anyone with it can add sales.
              </p>
              <Button variant="ghost" size="sm" onClick={generate}>Replace link</Button>
            </>
          ) : (
            <Button variant="outline" onClick={generate}>Create report link</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
