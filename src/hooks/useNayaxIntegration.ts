import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface NayaxSettings {
  id: string;
  userId: string;
  isConnected: boolean;
  lastSync: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NayaxTransaction {
  id: string;
  userId: string;
  machineId: string | null;
  nayaxTransactionId: string;
  transactionDate: string;
  amount: number;
  paymentMethod: string | null;
  nayaxMachineId: string | null;
  syncedAt: string;
  revenueEntryId: string | null;
}

export function useNayaxIntegration() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NayaxSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [linkedMachinesCount, setLinkedMachinesCount] = useState(0);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      // First try to get existing settings
      const { data, error } = await supabase
        .from("nayax_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          isConnected: data.is_connected ?? false,
          lastSync: data.last_sync,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } else {
        setSettings(null);
      }

      // Count machines with Nayax IDs configured
      const { count } = await supabase
        .from("location_machines")
        .select("id", { count: "exact", head: true })
        .not("nayax_machine_id", "is", null);

      setLinkedMachinesCount(count || 0);
    } catch (error: any) {
      console.error("Error fetching Nayax settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const connect = async (apiToken: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Validate the token by calling the edge function
      const { data: validateResult, error: validateError } = await supabase.functions.invoke(
        "sync-nayax-transactions",
        {
          body: { action: "validate", apiToken },
        }
      );

      if (validateError || !validateResult?.valid) {
        toast({
          title: "Invalid Token",
          description: validateResult?.error || "Could not validate Nayax API token. Please check and try again.",
          variant: "destructive",
        });
        return false;
      }

      // Token is valid, create/update settings
      const { data, error } = await supabase
        .from("nayax_settings")
        .upsert(
          {
            user_id: user.id,
            is_connected: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;

      setSettings({
        id: data.id,
        userId: data.user_id,
        isConnected: true,
        lastSync: data.last_sync,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });

      toast({
        title: "Connected to Nayax",
        description: "Your Nayax account has been connected successfully.",
      });

      return true;
    } catch (error: any) {
      console.error("Error connecting to Nayax:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Nayax. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const disconnect = async (): Promise<boolean> => {
    if (!user || !settings) return false;

    try {
      const { error } = await supabase
        .from("nayax_settings")
        .update({ is_connected: false, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      setSettings((prev) => (prev ? { ...prev, isConnected: false } : null));

      toast({
        title: "Disconnected from Nayax",
        description: "Your Nayax integration has been disabled.",
      });

      return true;
    } catch (error: any) {
      console.error("Error disconnecting from Nayax:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect from Nayax.",
        variant: "destructive",
      });
      return false;
    }
  };

  const syncTransactions = async (): Promise<{ synced: number; errors: number } | null> => {
    if (!user || !settings?.isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to Nayax first.",
        variant: "destructive",
      });
      return null;
    }

    setIsSyncing(true);

    try {
      const { data, error } = await supabase.functions.invoke("sync-nayax-transactions", {
        body: { action: "sync" },
      });

      if (error) throw error;

      // Update last sync timestamp
      await supabase
        .from("nayax_settings")
        .update({ last_sync: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      // Refresh settings
      await fetchSettings();

      const result = { synced: data?.synced || 0, errors: data?.errors || 0 };

      if (result.synced > 0) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${result.synced} transaction${result.synced === 1 ? "" : "s"}.`,
        });
      } else {
        toast({
          title: "Sync Complete",
          description: "No new transactions to sync.",
        });
      }

      return result;
    } catch (error: any) {
      console.error("Error syncing transactions:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync transactions from Nayax.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    settings,
    isLoading,
    isSyncing,
    linkedMachinesCount,
    isConnected: settings?.isConnected ?? false,
    connect,
    disconnect,
    syncTransactions,
    refetch: fetchSettings,
  };
}
