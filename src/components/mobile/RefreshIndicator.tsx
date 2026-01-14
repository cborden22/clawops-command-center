import { RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function RefreshIndicator({ 
  pullDistance, 
  isRefreshing, 
  threshold = 80 
}: RefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldShow = pullDistance > 10 || isRefreshing;
  const isReady = pullDistance >= threshold;

  if (!shouldShow) return null;

  return (
    <div 
      className="flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{ 
        height: isRefreshing ? 48 : pullDistance,
        opacity: Math.min(progress * 2, 1)
      }}
    >
      <div 
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-sm transition-all duration-200",
          isReady && !isRefreshing && "bg-primary/10 border-primary"
        )}
      >
        {isRefreshing ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : (
          <RefreshCw 
            className={cn(
              "h-5 w-5 transition-all duration-200",
              isReady ? "text-primary" : "text-muted-foreground"
            )}
            style={{
              transform: `rotate(${progress * 180}deg)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
