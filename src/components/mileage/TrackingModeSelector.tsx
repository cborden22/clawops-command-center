import { Navigation, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrackingMode = "gps" | "odometer";

interface TrackingModeSelectorProps {
  value: TrackingMode;
  onChange: (mode: TrackingMode) => void;
  disabled?: boolean;
}

export function TrackingModeSelector({
  value,
  onChange,
  disabled = false,
}: TrackingModeSelectorProps) {
  return (
    <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
      <button
        type="button"
        onClick={() => onChange("odometer")}
        disabled={disabled}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all",
          value === "odometer"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Gauge className="h-4 w-4" />
        <span>Manual Odometer</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("gps")}
        disabled={disabled}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all",
          value === "gps"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Navigation className="h-4 w-4" />
        <span>GPS Tracking</span>
      </button>
    </div>
  );
}
