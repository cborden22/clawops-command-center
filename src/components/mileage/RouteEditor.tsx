import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Route, Loader2, Calendar } from "lucide-react";
import { MileageRoute, RouteStopInput } from "@/hooks/useRoutesDB";
import { useLocations } from "@/hooks/useLocationsDB";
import { RouteStopItem } from "./RouteStopItem";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { format, addDays } from "date-fns";

interface RouteEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route?: MileageRoute;
  onSave: (
    name: string,
    description: string | undefined,
    stops: RouteStopInput[],
    isRoundTrip: boolean,
    scheduleFrequencyDays?: number,
    scheduleDayOfWeek?: number
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
  const [stops, setStops] = useState<StopState[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<string>("none");
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(1); // Monday default

  const FREQUENCY_OPTIONS = [
    { value: "none", label: "No Schedule", days: null },
    { value: "7", label: "Weekly", days: 7 },
    { value: "14", label: "Every 2 Weeks", days: 14 },
    { value: "21", label: "Every 3 Weeks", days: 21 },
    { value: "30", label: "Monthly", days: 30 },
  ];

  const DAY_OPTIONS = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const getNextScheduledDate = () => {
    if (scheduleFrequency === "none") return null;
    const today = new Date();
    const currentDow = today.getDay();
    let daysUntil = scheduleDayOfWeek - currentDow;
    if (daysUntil <= 0) daysUntil += 7;
    return addDays(today, daysUntil);
  };

  // Initialize form when dialog opens or route changes
  useEffect(() => {
    if (open) {
      if (route) {
        // Editing existing route
        setName(route.name);
        setDescription(route.description || "");
        setStops(route.stops.map(s => ({
          id: s.id,
          locationId: s.locationId,
          customLocationName: s.customLocationName,
          milesFromPrevious: s.milesFromPrevious,
        })));
        // Set schedule fields
        if (route.scheduleFrequencyDays) {
          setScheduleFrequency(String(route.scheduleFrequencyDays));
          setScheduleDayOfWeek(route.scheduleDayOfWeek ?? 1);
        } else {
          setScheduleFrequency("none");
          setScheduleDayOfWeek(1);
        }
      } else {
        // Creating new route - start with warehouse as first stop
        setName("");
        setDescription("");
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
        setScheduleFrequency("none");
        setScheduleDayOfWeek(1);
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
    return stops.reduce((sum, s) => sum + s.milesFromPrevious, 0);
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

    // Get schedule values
    const freqDays = scheduleFrequency !== "none" ? parseInt(scheduleFrequency) : undefined;
    const dayOfWeek = scheduleFrequency !== "none" ? scheduleDayOfWeek : undefined;

    const success = await onSave(
      name.trim(),
      description.trim() || undefined,
      stopsInput,
      false,
      freqDays,
      dayOfWeek
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
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            {route ? "Edit Route" : "Create Route"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-5">
          {/* Route Details Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Route Name *</Label>
              <Input
                placeholder="e.g., Monday Collection, West Side Route"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Description (optional)</Label>
              <Textarea
                placeholder="Add notes about this route..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <Separator />

          {/* Stops Section */}
          <div className="space-y-3 flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Stops ({stops.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStop}
                className="gap-1.5 h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Stop
              </Button>
            </div>
            
            <div className="relative z-10 max-h-[280px] overflow-y-auto pr-1 space-y-0">
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
                  showMilesConnector={index > 0}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Run Schedule Section */}
          <div className="relative z-0 space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Run Schedule (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Frequency</Label>
                <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Run On</Label>
                <Select 
                  value={String(scheduleDayOfWeek)} 
                  onValueChange={(v) => setScheduleDayOfWeek(parseInt(v))}
                  disabled={scheduleFrequency === "none"}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {scheduleFrequency !== "none" && (
              <p className="text-xs text-muted-foreground">
                Next run: <span className="font-medium text-foreground">{format(getNextScheduledDate()!, "EEEE, MMM d")}</span>
              </p>
            )}
          </div>

          <Separator />

          {/* Total Miles Summary */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Estimated Distance
              </span>
              <span className="text-xl font-bold text-primary">
                {calculateTotalMiles().toFixed(1)} mi
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 gap-2"
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
