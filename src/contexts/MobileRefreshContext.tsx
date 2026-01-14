import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";

interface MobileRefreshContextType {
  isRefreshing: boolean;
  registerRefresh: (key: string, fn: () => Promise<void>) => void;
  unregisterRefresh: (key: string) => void;
  triggerRefresh: () => Promise<void>;
}

const MobileRefreshContext = createContext<MobileRefreshContextType | null>(null);

export function MobileRefreshProvider({ children }: { children: ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshCallbacks = useRef<Map<string, () => Promise<void>>>(new Map());

  const registerRefresh = useCallback((key: string, fn: () => Promise<void>) => {
    refreshCallbacks.current.set(key, fn);
  }, []);

  const unregisterRefresh = useCallback((key: string) => {
    refreshCallbacks.current.delete(key);
  }, []);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const callbacks = Array.from(refreshCallbacks.current.values());
      await Promise.all(callbacks.map(fn => fn()));
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return (
    <MobileRefreshContext.Provider value={{ isRefreshing, registerRefresh, unregisterRefresh, triggerRefresh }}>
      {children}
    </MobileRefreshContext.Provider>
  );
}

export function useMobileRefresh() {
  const context = useContext(MobileRefreshContext);
  if (!context) {
    // Return no-op functions for non-mobile context
    return {
      isRefreshing: false,
      registerRefresh: () => {},
      unregisterRefresh: () => {},
      triggerRefresh: async () => {},
    };
  }
  return context;
}
