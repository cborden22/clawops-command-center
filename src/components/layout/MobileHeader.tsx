import { useLocation } from "react-router-dom";
import { RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic, hapticPatterns } from "@/utils/haptics";
import { getPageTitle } from "@/lib/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";

interface MobileHeaderProps {
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  onOpenCommandPalette?: () => void;
}

export function MobileHeader({ onRefresh, isRefreshing, onOpenCommandPalette }: MobileHeaderProps) {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      triggerHaptic(hapticPatterns.medium);
      await onRefresh();
    }
  };

  return (
    <header
      className="sticky top-0 z-40 bg-card border-b border-border"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="text-lg font-semibold truncate">{title}</h1>
        <div className="flex items-center gap-1 -mr-2">
          <OfflineIndicator />
          <NotificationBell />
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-95 transition-transform"
              aria-label="Open search"
            >
              <Search className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-95 transition-transform"
              aria-label="Refresh data"
            >
              <RefreshCw
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-all",
                  isRefreshing && "animate-spin text-primary"
                )}
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
