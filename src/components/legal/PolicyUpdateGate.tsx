import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LEGAL_VERSION } from "@/config/legal";

export function PolicyUpdateGate() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("terms_accepted_version")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && data && data.terms_accepted_version !== LEGAL_VERSION) {
        setOpen(true);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const accept = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        terms_accepted_version: LEGAL_VERSION,
        terms_accepted_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>We've updated our policies</DialogTitle>
          <DialogDescription>
            Please review and accept the latest{" "}
            <Link to="/legal/terms" target="_blank" className="underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" target="_blank" className="underline">
              Privacy Policy
            </Link>{" "}
            to continue using ClawOps.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={accept} disabled={saving} className="w-full">
            {saving ? "Saving..." : "I accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
