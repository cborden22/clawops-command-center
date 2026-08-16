import { useState } from "react";
import { Copy, ExternalLink, RefreshCw, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useLocationPortal, portalUrl } from "@/hooks/useLocationPortal";

interface OwnerPortalCardProps {
  locationId: string;
}

/** Share a read-only statements page with the venue owner. */
export function OwnerPortalCard({ locationId }: OwnerPortalCardProps) {
  const { settings, isLoading, isSaving, setEnabled, regenerate } = useLocationPortal(locationId);
  const [copied, setCopied] = useState(false);

  const url = settings.token ? portalUrl(settings.token) : "";

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied", description: "Send it to the venue owner." });
    } catch {
      toast({ title: "Copy failed", description: "Select the link and copy manually.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              Owner portal
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A private, login-free page where the venue owner can see their statements and report a
              machine issue.
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            disabled={isLoading || isSaving}
            onCheckedChange={setEnabled}
            aria-label="Enable owner portal"
          />
        </div>

        {settings.enabled && settings.token && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input readOnly value={url} className="text-xs" onFocus={(e) => e.currentTarget.select()} />
              <Button variant="outline" size="icon" onClick={copy} aria-label="Copy portal link">
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open portal"
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={regenerate} disabled={isSaving} className="px-0">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Create a new link
            </Button>
            {copied && <p className="text-xs text-primary">Copied to clipboard</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
