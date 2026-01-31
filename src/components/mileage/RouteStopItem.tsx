import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, MapPin, Building2, ArrowDown } from "lucide-react";
import { Location } from "@/hooks/useLocationsDB";

interface RouteStopItemProps {
  index: number;
  locationId?: string;
  customLocationName?: string;
  milesFromPrevious: number;
  locations: Location[];
  onUpdate: (data: {
    locationId?: string;
    customLocationName?: string;
    milesFromPrevious: number;
  }) => void;
  onRemove: () => void;
  canRemove: boolean;
  showMilesConnector?: boolean;
}

export function RouteStopItem({
  index,
  locationId,
  customLocationName,
  milesFromPrevious,
  locations,
  onUpdate,
  onRemove,
  canRemove,
  showMilesConnector = false,
}: RouteStopItemProps) {
  const isFirstStop = index === 0;
  const activeLocations = locations.filter(l => l.isActive);

  const handleLocationSelect = (value: string) => {
    if (value === "custom") {
      onUpdate({
        locationId: undefined,
        customLocationName: customLocationName || "",
        milesFromPrevious,
      });
    } else {
      onUpdate({
        locationId: value,
        customLocationName: undefined,
        milesFromPrevious,
      });
    }
  };

  const handleCustomNameChange = (value: string) => {
    onUpdate({
      locationId: undefined,
      customLocationName: value,
      milesFromPrevious,
    });
  };

  const handleMilesChange = (value: string) => {
    onUpdate({
      locationId,
      customLocationName,
      milesFromPrevious: parseFloat(value) || 0,
    });
  };

  const getLocationName = () => {
    if (locationId) {
      const loc = locations.find(l => l.id === locationId);
      return loc?.name || "Unknown Location";
    }
    return customLocationName || "";
  };

  return (
    <div className="relative">
      {/* Miles connector from previous stop */}
      {showMilesConnector && (
        <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
          <ArrowDown className="h-4 w-4" />
          <span className="text-xs font-medium">{milesFromPrevious > 0 ? `${milesFromPrevious} mi` : "— mi"}</span>
        </div>
      )}

      {/* Stop card */}
      <div className="relative p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors">
        {/* Header with stop number and delete button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {index + 1}
            </span>
            <span className="text-sm font-medium text-foreground">
              {isFirstStop ? "Starting Point" : `Stop ${index + 1}`}
            </span>
          </div>
          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Location selector */}
        <div className="space-y-3">
          <Select
            value={locationId || (customLocationName !== undefined ? "custom" : "")}
            onValueChange={handleLocationSelect}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Select location..." />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} className="z-50 bg-popover">
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Custom Location</span>
                </div>
              </SelectItem>
              {activeLocations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{loc.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom location input */}
          {!locationId && customLocationName !== undefined && (
            <Input
              placeholder="Enter location name or address..."
              value={customLocationName}
              onChange={(e) => handleCustomNameChange(e.target.value)}
              className="h-10"
            />
          )}

          {/* Miles from previous (for non-first stops) */}
          {!isFirstStop && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Miles from previous:</span>
              <NumberInput
                placeholder="0"
                value={milesFromPrevious > 0 ? milesFromPrevious.toString() : ""}
                onChange={(e) => handleMilesChange(e.target.value)}
                step="0.1"
                min="0"
                className="w-24 h-9"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
