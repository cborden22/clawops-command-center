import { AlertCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";

export function UpdateNotification() {
  const { updateAvailable, applyUpdate, dismissUpdate } = useServiceWorkerUpdate();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 animate-fade-in safe-area-inset-top">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium truncate">A new version is available!</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={applyUpdate}
            className="h-8 px-3 touch-manipulation active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Update
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={dismissUpdate}
            className="h-8 w-8 p-0 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
