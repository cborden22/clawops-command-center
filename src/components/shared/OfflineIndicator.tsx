import { CloudOff, RefreshCw, WifiOff } from "lucide-react";
import { useOfflineSync } from "@/contexts/OfflineSyncContext";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
  className?: string;
}

/** Compact chip: hidden when online with an empty queue. */
export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  const offline = !isOnline;

  return (
    <button
      type="button"
      onClick={() => syncNow()}
      disabled={offline || isSyncing}
      aria-label={offline ? "Offline" : `${pendingCount} changes pending sync`}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 h-8 text-xs font-medium transition-colors",
        offline
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
        className
      )}
    >
      {offline ? (
        <WifiOff className="h-3.5 w-3.5" />
      ) : isSyncing ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CloudOff className="h-3.5 w-3.5" />
      )}
      <span className="whitespace-nowrap">
        {offline
          ? pendingCount > 0
            ? `Offline · ${pendingCount}`
            : "Offline"
          : isSyncing
            ? "Syncing…"
            : `${pendingCount} pending`}
      </span>
    </button>
  );
}
