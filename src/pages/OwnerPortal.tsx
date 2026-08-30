import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { MapPin, FileText, Wrench, Sparkles, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface PortalMachine {
  id: string;
  machine_type: string;
  custom_label: string | null;
  count: number;
  unit_code: string | null;
}

interface PortalLocation {
  location_id: string;
  location_name: string;
  address: string | null;
  machines: PortalMachine[];
}

interface PortalStatement {
  id: string;
  start_date: string;
  end_date: string;
  total_revenue: number;
  commission_percentage: number;
  commission_amount: number;
  machine_count: number;
  commission_paid: boolean;
  commission_paid_at: string | null;
}

const OwnerPortal = () => {
  const { token } = useParams<{ token: string }>();
  const [location, setLocation] = useState<PortalLocation | null>(null);
  const [statements, setStatements] = useState<PortalStatement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      const [locRes, stmtRes] = await Promise.all([
        supabase.rpc("get_location_portal", { portal_token_input: token }),
        supabase.rpc("get_location_portal_statements", { portal_token_input: token }),
      ]);

      const loc = Array.isArray(locRes.data) ? locRes.data[0] : null;
      if (loc) {
        setLocation({
          ...(loc as any),
          machines: ((loc as any).machines || []) as PortalMachine[],
        });
      }
      if (Array.isArray(stmtRes.data)) setStatements(stmtRes.data as unknown as PortalStatement[]);
      setIsLoading(false);
    };
    load();
  }, [token]);

  const totals = useMemo(() => {
    const paid = statements.filter((s) => s.commission_paid);
    return {
      lifetime: statements.reduce((sum, s) => sum + Number(s.commission_amount || 0), 0),
      paid: paid.reduce((sum, s) => sum + Number(s.commission_amount || 0), 0),
      outstanding: statements
        .filter((s) => !s.commission_paid)
        .reduce((sum, s) => sum + Number(s.commission_amount || 0), 0),
    };
  }, [statements]);

  useEffect(() => {
    document.title = location
      ? `${location.location_name} · Owner Portal`
      : "Owner Portal";
  }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-2">
            <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto" />
            <h1 className="text-lg font-semibold">This link isn't active</h1>
            <p className="text-sm text-muted-foreground">
              The portal link may have been turned off or replaced. Ask your machine operator for a
              new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Owner portal</p>
          <h1 className="text-2xl font-bold text-foreground">{location.location_name}</h1>
          {location.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {location.address}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Lifetime</p>
              <p className="text-lg font-semibold tabular-nums">${totals.lifetime.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-lg font-semibold tabular-nums">${totals.paid.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-lg font-semibold tabular-nums">${totals.outstanding.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Commission statements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No statements have been issued yet.</p>
            ) : (
              <ul className="space-y-2">
                {statements.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {format(parseISO(s.start_date), "MMM d")} –{" "}
                        {format(parseISO(s.end_date), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Number(s.commission_percentage).toFixed(0)}% of $
                        {Number(s.total_revenue).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold tabular-nums">
                        ${Number(s.commission_amount).toFixed(2)}
                      </p>
                      <Badge variant={s.commission_paid ? "secondary" : "outline"} className="mt-0.5">
                        {s.commission_paid ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Machines at this location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {location.machines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No machines listed.</p>
            ) : (
              location.machines.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.custom_label || m.machine_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.unit_code ? `Unit ${m.unit_code} · ` : ""}
                      {m.count} {m.count === 1 ? "machine" : "machines"}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link to={`/m/${m.id}`}>
                      <Wrench className="h-3.5 w-3.5 mr-1.5" />
                      Report issue
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center pb-8">
          This page is read-only and shared privately with you by your machine operator.
        </p>
      </main>
    </div>
  );
};

export default OwnerPortal;
