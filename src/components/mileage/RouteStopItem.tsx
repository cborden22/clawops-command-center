import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, MapPin, Building2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { Location } from "@/hooks/useLocationsDB";

interface RouteStopItemProps {
  index: number;
  locationId?: string;
  customLocationName?: string;
  milesFromPrevious: number;
  isAuto: boolean;
  isCalculating?: boolean;
  autoFailed?: boolean;
  locations: Location[];
  onUpdate: (data: {
    locationId?: string;
    customLocationName?: string;
    milesFromPrevious?: number;
    isAuto?: boolean;
  }) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  canRemove: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function RouteStopItem({
  index,
  locationId,
  customLocationName,
  milesFromPrevious,
  isAuto,
  isCalculating = false,
  autoFailed = false,
  locations,
  onUpdate,
  onRemove,
  onMove,
  canRemove,
  canMoveUp,
  canMoveDown,
}: RouteStopItemProps) {
  const activeLocations = locations.filter((l) => l.isActive);
  const selectedLocation = locationId ? locations.find((l) => l.id === locationId) : undefined;

  const handleLocationSelect = (value: string) => {
    if (value === "custom") {
      onUpdate({ locationId: undefined, customLocationName: customLocationName || "", isAuto: true });
    } else {
      onUpdate({ locationId: value, customLocationName: undefined, isAuto: true });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <Select
            value={locationId || (customLocationName !== undefined ? "custom" : "")}
            onValueChange={handleLocationSelect}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Select location..." />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} className="z-[100] bg-popover">
              {activeLocations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{loc.name}</span>
                  </div>
                </SelectItem>
              ))}
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Custom stop</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex shrink-0 flex-col gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={!canMoveUp}
            onClick={() => onMove("up")}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={!canMoveDown}
            onClick={() => onMove("down")}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {!locationId && customLocationName !== undefined && (
        <Input
          placeholder="Enter stop name or address..."
          value={customLocationName}
          onChange={(e) => onUpdate({ locationId: undefined, customLocationName: e.target.value, isAuto: true })}
          onKeyDown={(e) => e.stopPropagation()}
          className="mt-2 h-9"
        />
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {selectedLocation?.address || (locationId ? "No address on file" : "Address helps auto-calculate miles")}
        </p>

        <div className="flex shrink-0 items-center gap-1.5">
          {isCalculating ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> calculating
            </span>
          ) : (
            <Badge variant={isAuto ? "secondary" : "outline"} className="text-[10px]">
              {isAuto ? "Auto" : "Manual"}
            </Badge>
          )}
          <NumberInput
            placeholder="0"
            value={milesFromPrevious > 0 ? String(milesFromPrevious) : ""}
            onChange={(e) =>
              onUpdate({
                locationId,
                customLocationName,
                milesFromPrevious: parseFloat(e.target.value) || 0,
                isAuto: false,
              })
            }
            onKeyDown={(e) => e.stopPropagation()}
            step="0.1"
            min="0"
            className="h-9 w-20 tabular-nums"
          />
          <span className="text-xs text-muted-foreground">mi</span>
        </div>
      </div>

      {autoFailed && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Couldn't look up this leg automatically — enter the miles manually.
        </p>
      )}
    </div>
  );
}
