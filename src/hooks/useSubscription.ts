import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionState {
  isSubscribed: boolean;
  isComplimentary: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    isComplimentary: false,
    productId: null,
    subscriptionEnd: null,
    isLoading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      setState({
        isSubscribed: data?.subscribed ?? false,
        isComplimentary: data?.is_complimentary ?? false,
        productId: data?.product_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        isLoading: false,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [session?.access_token]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Poll every 60 seconds
  useEffect(() => {
    if (!session?.access_token) return;
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription, session?.access_token]);

  return { ...state, refreshSubscription: checkSubscription };
}
