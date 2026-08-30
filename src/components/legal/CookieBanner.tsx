import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const ACK_KEY = "clawops_cookie_notice_ack";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ACK_KEY)) setVisible(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  if (!visible) return null;

  const acknowledge = () => {
    try {
      localStorage.setItem(ACK_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="rounded-xl border border-border bg-card shadow-lg p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Cookie className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">
            ClawOps uses essential storage only — to keep you signed in and remember your preferences. No ads,
            no tracking.{" "}
            <Link to="/cookies" className="underline hover:text-foreground">
              Cookie notice
            </Link>
          </p>
        </div>
        <Button size="sm" className="w-full" onClick={acknowledge}>
          Got it
        </Button>
      </div>
    </div>
  );
}
