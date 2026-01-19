import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, MapPin, Building2 } from "lucide-react";
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
      const loc = locations.find(l => l.id === value);
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

  return (
    <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center gap-1 text-muted-foreground pt-2">
        <GripVertical className="h-4 w-4 cursor-grab" />
        <span className="text-xs font-medium w-4">{index + 1}</span>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Select
            value={locationId || (customLocationName !== undefined ? "custom" : "")}
            onValueChange={handleLocationSelect}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select location..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Custom Location
                </div>
              </SelectItem>
              {activeLocations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    {loc.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!locationId && customLocationName !== undefined && (
          <Input
            placeholder="Enter location name or address..."
            value={customLocationName}
            onChange={(e) => handleCustomNameChange(e.target.value)}
            className="text-sm"
          />
        )}

        {!isFirstStop && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Miles from previous:</span>
            <NumberInput
              placeholder="0"
              value={milesFromPrevious > 0 ? milesFromPrevious.toString() : ""}
              onChange={(e) => handleMilesChange(e.target.value)}
              step="0.1"
              min="0"
              className="w-24 h-8 text-sm"
            />
          </div>
        )}
      </div>

      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive/70 hover:text-destructive flex-shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
