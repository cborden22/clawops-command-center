import { useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic, hapticPatterns } from "@/utils/haptics";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/revenue": "Revenue",
  "/inventory": "Inventory",
  "/locations": "Locations",
  "/mileage": "Routes",
  "/leads": "Leads",
  "/maintenance": "Maintenance",
  "/reports": "Reports",
  "/receipts": "Receipts",
  "/documents": "Documents",
  "/settings": "Settings",
  "/commission-summary": "Commission",
  "/compliance": "Compliance",
};

interface MobileHeaderProps {
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export function MobileHeader({ onRefresh, isRefreshing }: MobileHeaderProps) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "ClawOps";

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      triggerHaptic(hapticPatterns.medium);
      await onRefresh();
    }
  };

  return (
    <header 
      className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border"
      style={{ 
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 -m-1 min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation active:scale-95 transition-transform"
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
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
