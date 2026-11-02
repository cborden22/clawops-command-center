import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CreditCard } from "lucide-react";
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

export function NayaxSyncCard() {
  const [run, setRun] = useState<Run | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("nayax_sync_runs")
      .select("status, rows_upserted, machines_checked, error, started_at, finished_at, trigger")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRun(data as Run | null);
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncNow = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("nayax-sync", { body: {} });
    setSyncing(false);
    await load();
    if (error) {
      toast({ title: "Nayax sync failed", description: "Please try again in a moment.", variant: "destructive" });
    } else {
      toast({ title: "Nayax sync finished", description: `${data?.rows ?? 0} sales from ${data?.machines ?? 0} machines.` });
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Nayax Sales Sync
        </CardTitle>
        <CardDescription>Card sales sync automatically every night at 2:00 AM Eastern for machines with a Nayax ID.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">Last sync:</span>
          <span className="font-medium">
            {run ? new Date(run.finished_at ?? run.started_at).toLocaleString() : "Never"}
          </span>
          {run && <Badge variant={statusVariant(run.status)} className="capitalize">{run.status}</Badge>}
        </div>
        {run && (
          <p className="text-sm text-muted-foreground">
            {run.rows_upserted} sales from {run.machines_checked} machines ({run.trigger === "cron" ? "nightly" : "manual"})
          </p>
        )}
        {run?.error && <p className="text-sm text-destructive break-words">{run.error}</p>}
        <Button onClick={syncNow} disabled={syncing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync now"}
        </Button>
      </CardContent>
    </Card>
  );
}
