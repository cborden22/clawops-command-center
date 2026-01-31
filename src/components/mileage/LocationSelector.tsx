import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MapPin, Building2, Edit3 } from "lucide-react";

interface Location {
  id: string;
  name: string;
  address?: string | null;
}

export interface LocationSelection {
  type: "warehouse" | "location" | "custom";
  locationId?: string;
  customName?: string;
}

interface LocationSelectorProps {
  type: "from" | "to";
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  locations: Location[];
  warehouseAddress?: string;
  label?: string;
}

export function LocationSelector({
  type,
  value,
  onChange,
  locations,
  warehouseAddress,
  label,
}: LocationSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(value.type === "custom");

  const getDisplayValue = () => {
    if (value.type === "warehouse") return "warehouse";
    if (value.type === "location" && value.locationId) return value.locationId;
    if (value.type === "custom") return "custom";
    return "";
  };

  const getDisplayLabel = () => {
    if (value.type === "warehouse") {
      return warehouseAddress || "Warehouse";
    }
    if (value.type === "location" && value.locationId) {
      const loc = locations.find((l) => l.id === value.locationId);
      return loc?.name || "Unknown Location";
    }
    if (value.type === "custom" && value.customName) {
      return value.customName;
    }
    return type === "from" ? "Select start location..." : "Select destination...";
  };

  const handleSelectChange = (selectValue: string) => {
    if (selectValue === "warehouse") {
      setShowCustomInput(false);
      onChange({ type: "warehouse" });
    } else if (selectValue === "custom") {
      setShowCustomInput(true);
      onChange({ type: "custom", customName: "" });
    } else {
      setShowCustomInput(false);
      onChange({ type: "location", locationId: selectValue });
    }
  };

  const handleCustomChange = (customName: string) => {
    onChange({ type: "custom", customName });
  };

  const getLocationLabel = (loc: Location) => {
    return loc.name + (loc.address ? ` - ${loc.address}` : "");
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label || (type === "from" ? "From *" : "To *")}</Label>
      
      <Select value={getDisplayValue()} onValueChange={handleSelectChange}>
        <SelectTrigger className="h-12">
          <SelectValue placeholder={getDisplayLabel()}>
            <div className="flex items-center gap-2 truncate">
              {value.type === "warehouse" && <Building2 className="h-4 w-4 flex-shrink-0 text-primary" />}
              {value.type === "location" && <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />}
              {value.type === "custom" && <Edit3 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
              <span className="truncate">{getDisplayLabel()}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background border border-border z-50">
          {/* Warehouse option - only for "from" type */}
          {type === "from" && (
            <>
              <SelectItem value="warehouse">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">Warehouse</span>
                    {warehouseAddress && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {warehouseAddress}
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
              {locations.length > 0 && <Separator className="my-1" />}
            </>
          )}
          
          {/* Saved Locations */}
          {locations.length > 0 && (
            <>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{loc.name}</span>
                      {loc.address && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {loc.address}
                        </span>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
              <Separator className="my-1" />
            </>
          )}
          
          {/* Custom Location option */}
          <SelectItem value="custom">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-muted-foreground" />
              <span>Enter Custom Location...</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Custom location text input */}
      {showCustomInput && (
        <Input
          placeholder="Enter location name or address..."
          value={value.customName || ""}
          onChange={(e) => handleCustomChange(e.target.value)}
          className="h-12"
          autoFocus
        />
      )}

      {/* Display helper text for warehouse */}
      {value.type === "warehouse" && warehouseAddress && (
        <p className="text-xs text-muted-foreground pl-1">{warehouseAddress}</p>
      )}
    </div>
  );
}

// Helper to get the display string for a location selection
export function getLocationDisplayString(
  selection: LocationSelection,
  locations: { id: string; name: string; address?: string | null }[],
  warehouseAddress?: string
): string {
  if (selection.type === "warehouse") {
    return warehouseAddress || "Warehouse";
  }
  if (selection.type === "location" && selection.locationId) {
    const loc = locations.find((l) => l.id === selection.locationId);
    return loc?.name || "Unknown Location";
  }
  if (selection.type === "custom" && selection.customName) {
    return selection.customName;
  }
  return "";
}
