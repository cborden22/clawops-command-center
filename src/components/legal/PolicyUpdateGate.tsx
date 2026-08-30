import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LEGAL_VERSION } from "@/config/legal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PolicyUpdateGate() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("terms_accepted_version")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && data && data.terms_accepted_version !== LEGAL_VERSION) {
        setOpen(true);
      }
    })();
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
      .eq("user_id", user.id);
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* must accept to continue */ }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>We've updated our policies</DialogTitle>
          <DialogDescription>
            Please review and accept the current{" "}
            <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            to keep using ClawOps.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={accept} disabled={saving} className="w-full">
            {saving ? "Saving..." : "I agree"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
