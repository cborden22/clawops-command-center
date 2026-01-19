import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Route, Loader2 } from "lucide-react";
import { MileageRoute, RouteStopInput } from "@/hooks/useRoutesDB";
import { useLocations } from "@/hooks/useLocationsDB";
import { RouteStopItem } from "./RouteStopItem";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface RouteEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route?: MileageRoute;
  onSave: (
    name: string,
    description: string | undefined,
    stops: RouteStopInput[],
    isRoundTrip: boolean
  ) => Promise<boolean>;
}

interface StopState {
  id: string;
  locationId?: string;
  customLocationName?: string;
  milesFromPrevious: number;
}

export function RouteEditor({ open, onOpenChange, route, onSave }: RouteEditorProps) {
  const { locations } = useLocations();
  const { settings } = useAppSettings();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [stops, setStops] = useState<StopState[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when dialog opens or route changes
  useEffect(() => {
    if (open) {
      if (route) {
        // Editing existing route
        setName(route.name);
        setDescription(route.description || "");
        setIsRoundTrip(route.isRoundTrip);
        setStops(route.stops.map(s => ({
          id: s.id,
          locationId: s.locationId,
          customLocationName: s.customLocationName,
          milesFromPrevious: s.milesFromPrevious,
        })));
      } else {
        // Creating new route - start with warehouse as first stop
        setName("");
        setDescription("");
        setIsRoundTrip(true);
        setStops([
          {
            id: crypto.randomUUID(),
            customLocationName: settings.warehouseAddress || "Starting Point",
            milesFromPrevious: 0,
          },
          {
            id: crypto.randomUUID(),
            locationId: undefined,
            customLocationName: "",
            milesFromPrevious: 0,
          },
        ]);
      }
    }
  }, [open, route, settings.warehouseAddress]);

  const handleAddStop = () => {
    setStops(prev => [...prev, {
      id: crypto.randomUUID(),
      locationId: undefined,
      customLocationName: "",
      milesFromPrevious: 0,
    }]);
  };

  const handleUpdateStop = (index: number, data: {
    locationId?: string;
    customLocationName?: string;
    milesFromPrevious: number;
  }) => {
    setStops(prev => prev.map((stop, i) => 
      i === index ? { ...stop, ...data } : stop
    ));
  };

  const handleRemoveStop = (index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotalMiles = () => {
    const oneWay = stops.reduce((sum, s) => sum + s.milesFromPrevious, 0);
    return isRoundTrip ? oneWay * 2 : oneWay;
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (stops.length < 2) return;

    // Validate all stops have a name
    const invalidStop = stops.find(s => !s.locationId && !s.customLocationName?.trim());
    if (invalidStop) return;

    setIsSaving(true);
    
    const stopsInput: RouteStopInput[] = stops.map(s => ({
      locationId: s.locationId,
      customLocationName: s.customLocationName?.trim(),
      milesFromPrevious: s.milesFromPrevious,
    }));

    const success = await onSave(
      name.trim(),
      description.trim() || undefined,
      stopsInput,
      isRoundTrip
    );

    setIsSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const isValid = name.trim() && 
    stops.length >= 2 && 
    stops.every(s => s.locationId || s.customLocationName?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            {route ? "Edit Route" : "Create Route"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Route Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Route Name *</Label>
            <Input
              placeholder="e.g., Monday Collection, West Side Route"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Description (optional)</Label>
            <Textarea
              placeholder="Add notes about this route..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Round Trip Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium cursor-pointer">Round Trip</Label>
            </div>
            <Switch checked={isRoundTrip} onCheckedChange={setIsRoundTrip} />
          </div>

          {/* Stops */}
          <div className="space-y-2 flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Stops ({stops.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStop}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Stop
              </Button>
            </div>
            
            <ScrollArea className="h-[200px] pr-3">
              <div className="space-y-2">
                {stops.map((stop, index) => (
                  <RouteStopItem
                    key={stop.id}
                    index={index}
                    locationId={stop.locationId}
                    customLocationName={stop.customLocationName}
                    milesFromPrevious={stop.milesFromPrevious}
                    locations={locations}
                    onUpdate={(data) => handleUpdateStop(index, data)}
                    onRemove={() => handleRemoveStop(index)}
                    canRemove={stops.length > 2}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Total Miles */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Distance {isRoundTrip && "(round trip)"}
              </span>
              <span className="text-lg font-bold text-primary">
                {calculateTotalMiles().toFixed(1)} mi
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSubmit}
              disabled={!isValid || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                route ? "Update Route" : "Create Route"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
