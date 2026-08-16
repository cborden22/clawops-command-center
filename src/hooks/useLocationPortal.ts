import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PortalSettings {
  enabled: boolean;
  token: string | null;
}

function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export function portalUrl(token: string) {
  return `${window.location.origin}/portal/${token}`;
}

/** Owner-side controls for a location's public owner portal link. */
export function useLocationPortal(locationId: string | undefined) {
  const [settings, setSettings] = useState<PortalSettings>({ enabled: false, token: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetch = useCallback(async () => {
    if (!locationId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("locations")
      .select("portal_enabled, portal_token")
      .eq("id", locationId)
      .maybeSingle();
    if (!error && data) {
      setSettings({ enabled: !!data.portal_enabled, token: data.portal_token });
    }
    setIsLoading(false);
  }, [locationId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const setEnabled = async (enabled: boolean) => {
    if (!locationId) return;
    setIsSaving(true);
    const token = enabled ? settings.token || generateToken() : settings.token;
    const { error } = await supabase
      .from("locations")
      .update({ portal_enabled: enabled, portal_token: token })
      .eq("id", locationId);
    setIsSaving(false);
    if (error) {
      toast({ title: "Error", description: "Could not update the portal link.", variant: "destructive" });
      return;
    }
    setSettings({ enabled, token });
  };

  const regenerate = async () => {
    if (!locationId) return;
    setIsSaving(true);
    const token = generateToken();
    const { error } = await supabase
      .from("locations")
      .update({ portal_token: token, portal_enabled: true })
      .eq("id", locationId);
    setIsSaving(false);
    if (error) {
      toast({ title: "Error", description: "Could not create a new link.", variant: "destructive" });
      return;
    }
    setSettings({ enabled: true, token });
    toast({ title: "New link created", description: "The previous link no longer works." });
  };

  return { settings, isLoading, isSaving, setEnabled, regenerate, refetch: fetch };
}
