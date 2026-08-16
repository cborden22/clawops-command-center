import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { drainQueue, enqueue, queueCount, QueuedOp, isOffline } from "@/lib/offlineQueue";
import { toast } from "@/hooks/use-toast";

interface OfflineSyncContextType {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  /** Queue a write for later. Returns after it is durably stored. */
  queueWrite: (op: Omit<QueuedOp, "id" | "createdAt">) => Promise<void>;
  syncNow: () => Promise<void>;
  refreshCount: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(!isOffline());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncing = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      setPendingCount(await queueCount());
    } catch {
      /* IndexedDB unavailable */
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (syncing.current || isOffline()) return;
    syncing.current = true;
    setIsSyncing(true);
    try {
      const before = await queueCount();
      if (before === 0) return;
      const result = await drainQueue();
      setPendingCount(result.remaining);
      if (result.synced > 0) {
        toast({
          title: "Synced",
          description: `${result.synced} offline ${result.synced === 1 ? "change" : "changes"} uploaded.`,
        });
      }
    } finally {
      syncing.current = false;
      setIsSyncing(false);
    }
  }, []);

  const queueWrite = useCallback(
    async (op: Omit<QueuedOp, "id" | "createdAt">) => {
      await enqueue(op);
      await refreshCount();
    },
    [refreshCount]
  );

  useEffect(() => {
    refreshCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };
    const handleOffline = () => setIsOnline(false);
    const handleFocus = () => {
      if (!isOffline()) syncNow();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleFocus);

    // Attempt an initial drain on load
    syncNow();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshCount, syncNow]);

  return (
    <OfflineSyncContext.Provider
      value={{ isOnline, pendingCount, isSyncing, queueWrite, syncNow, refreshCount }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSync() {
  const ctx = useContext(OfflineSyncContext);
  if (!ctx) throw new Error("useOfflineSync must be used within an OfflineSyncProvider");
  return ctx;
}
