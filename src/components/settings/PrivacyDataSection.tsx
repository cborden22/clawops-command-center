import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, ShieldCheck, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { COMPANY, LEGAL_LINKS } from "@/config/legal";

const EXPORT_TABLES = [
  "profiles",
  "locations",
  "location_machines",
  "revenue_entries",
  "recurring_revenue",
  "commission_summaries",
  "inventory_items",
  "inventory_balances",
  "inventory_locations",
  "warehouses",
  "leads",
  "lead_activities",
  "mileage_entries",
  "mileage_routes",
  "vehicles",
  "machine_collections",
  "maintenance_reports",
  "calendar_tasks",
  "team_members",
] as const;

export function PrivacyDataSection() {
  const { user, signOut } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acceptedVersion, setAcceptedVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("terms_accepted_version, terms_accepted_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.terms_accepted_version) {
          const when = data.terms_accepted_at
            ? new Date(data.terms_accepted_at).toLocaleDateString()
            : null;
          setAcceptedVersion(when ? `${data.terms_accepted_version} on ${when}` : data.terms_accepted_version);
        }
      });
  }, [user]);

  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const bundle: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        account: { id: user.id, email: user.email },
        provider: COMPANY.displayName,
      };

      for (const table of EXPORT_TABLES) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).from(table).select("*");
        bundle[table] = error ? { error: error.message } : data ?? [];
      }

      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `clawops-data-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(a.href);

      toast({ title: "Export ready", description: "Your data has been downloaded." });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { confirm: "DELETE" },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      toast({ title: "Account deleted", description: "Your account and data have been removed." });
      setDialogOpen(false);
      await signOut();
      window.location.href = "/sales";
    } catch (e) {
      toast({
        title: "Deletion failed",
        description: e instanceof Error ? e.message : "Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Privacy &amp; Data
        </CardTitle>
        <CardDescription>
          Export everything in your account, review our policies, or permanently delete your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Export my data</p>
            <p className="text-xs text-muted-foreground">
              Downloads a JSON file with your locations, machines, revenue, inventory, leads,
              mileage, and maintenance records.
            </p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={isExporting} className="gap-2 shrink-0">
            <Download className="h-4 w-4" />
            {isExporting ? "Preparing..." : "Export"}
          </Button>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium">Legal documents</p>
          {acceptedVersion && (
            <p className="mt-1 text-xs text-muted-foreground">
              You accepted policy version {acceptedVersion}.
            </p>
          )}
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {l.label}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Privacy requests: {COMPANY.privacyEmail} · Support: {COMPANY.supportEmail}
          </p>
        </div>

        <Separator />

        <div className="rounded-lg border border-destructive/30 p-4">
          <p className="text-sm font-medium text-destructive">Delete my account</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Permanently removes your account and all business data. This cannot be undone. Cancel
            any active subscription first so you are not billed again.
          </p>
          <Button
            variant="destructive"
            className="mt-3 gap-2"
            onClick={() => {
              setConfirmText("");
              setDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        </div>

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your ClawOps account?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes your locations, machines, revenue, inventory, leads,
                mileage, photos, and team records. Export your data first if you need it. Type{" "}
                <strong>DELETE</strong> to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">Confirmation</Label>
              <Input
                id="delete-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="DELETE"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={confirmText !== "DELETE" || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete forever"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
