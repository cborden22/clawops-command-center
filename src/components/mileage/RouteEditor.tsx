import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Route, Loader2, Calendar, Warehouse as WarehouseIcon, RefreshCw, MapPin } from "lucide-react";
import { MileageRoute, RouteStopInput } from "@/hooks/useRoutesDB";
import { useLocations } from "@/hooks/useLocationsDB";
import { useWarehouses } from "@/hooks/useWarehousesDB";
import { RouteStopItem } from "./RouteStopItem";
import { format, addDays } from "date-fns";
import { geocodeAddress } from "@/lib/geocode";
import { drivingMiles, LatLng } from "@/lib/routeDistance";

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
  isAuto: boolean;
  autoFailed?: boolean;
}

const FREQUENCY_OPTIONS = [
  { value: "none", label: "No Schedule" },
  { value: "7", label: "Weekly" },
  { value: "14", label: "Every 2 Weeks" },
  { value: "21", label: "Every 3 Weeks" },
  { value: "30", label: "Monthly" },
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

const CUSTOM_START = "custom";

export function RouteEditor({ open, onOpenChange, route, onSave }: RouteEditorProps) {
  const { locations } = useLocations();
  const { warehouses, defaultWarehouse, getWarehouseAddress } = useWarehouses();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startWarehouseId, setStartWarehouseId] = useState<string>(CUSTOM_START);
  const [startName, setStartName] = useState("");
  const [stops, setStops] = useState<StopState[]>([]);
  const [returnToStart, setReturnToStart] = useState(false);
  const [returnMiles, setReturnMiles] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<string>("none");
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(1);

  const coordCache = useRef<Map<string, LatLng | null>>(new Map());

  const getNextScheduledDate = () => {
    if (scheduleFrequency === "none") return null;
    const today = new Date();
    let daysUntil = scheduleDayOfWeek - today.getDay();
    if (daysUntil <= 0) daysUntil += 7;
    return addDays(today, daysUntil);
  };

  // Initialize form when dialog opens or route changes
  useEffect(() => {
    if (!open) return;

    if (route) {
      setName(route.name);
      setDescription(route.description || "");
      const [first, ...rest] = route.stops;
      const firstLabel = first?.customLocationName || locations.find((l) => l.id === first?.locationId)?.name || "";
      const matchedWarehouse = warehouses.find((w) => w.name === firstLabel);
      setStartWarehouseId(matchedWarehouse?.id || CUSTOM_START);
      setStartName(firstLabel);

      const last = rest[rest.length - 1];
      const lastLabel = last?.customLocationName || "";
      const isReturn = rest.length > 0 && lastLabel === firstLabel && firstLabel !== "";
      const middle = isReturn ? rest.slice(0, -1) : rest;

      setStops(
        middle.map((s) => ({
          id: s.id,
          locationId: s.locationId,
          customLocationName: s.locationId ? undefined : s.customLocationName ?? "",
          milesFromPrevious: s.milesFromPrevious,
          isAuto: false,
        }))
      );
      setReturnToStart(isReturn);
      setReturnMiles(isReturn ? last.milesFromPrevious : 0);

      if (route.scheduleFrequencyDays) {
        setScheduleFrequency(String(route.scheduleFrequencyDays));
        setScheduleDayOfWeek(route.scheduleDayOfWeek ?? 1);
      } else {
        setScheduleFrequency("none");
        setScheduleDayOfWeek(1);
      }
    } else {
      setName("");
      setDescription("");
      setStartWarehouseId(defaultWarehouse?.id || CUSTOM_START);
      setStartName(defaultWarehouse?.name || "");
      setStops([
        { id: crypto.randomUUID(), locationId: undefined, customLocationName: undefined, milesFromPrevious: 0, isAuto: true },
      ]);
      setReturnToStart(true);
      setReturnMiles(0);
      setScheduleFrequency("none");
      setScheduleDayOfWeek(1);
    }
  }, [open, route?.id]);

  // Keep the start name in sync when the default warehouse loads late
  useEffect(() => {
    if (open && !route && startWarehouseId === CUSTOM_START && defaultWarehouse) {
      setStartWarehouseId(defaultWarehouse.id);
      setStartName(defaultWarehouse.name);
    }
  }, [defaultWarehouse?.id]);

  const startWarehouse = warehouses.find((w) => w.id === startWarehouseId) || null;
  const startAddress = startWarehouse ? getWarehouseAddress(startWarehouse) : startName;
  const startLabel = startWarehouse ? startWarehouse.name : startName;

  /** Resolve coordinates for a stop (location record, warehouse, or free text). */
  const resolveCoords = useCallback(
    async (key: string, address: string | undefined, known?: LatLng): Promise<LatLng | null> => {
      if (known) return known;
      if (coordCache.current.has(key)) return coordCache.current.get(key) ?? null;
      if (!address?.trim()) {
        coordCache.current.set(key, null);
        return null;
      }
      const coords = await geocodeAddress(address);
      coordCache.current.set(key, coords);
      return coords;
    },
    []
  );

  const stopSignature = useMemo(
    () =>
      [
        startWarehouseId,
        startAddress,
        returnToStart,
        ...stops.map((s) => `${s.locationId ?? ""}|${s.customLocationName ?? ""}|${s.isAuto}`),
      ].join("~"),
    [startWarehouseId, startAddress, returnToStart, stops]
  );

  const recalculate = useCallback(
    async (force = false) => {
      const points: { key: string; address?: string; known?: LatLng }[] = [
        { key: `start:${startWarehouseId}:${startAddress}`, address: startAddress },
        ...stops.map((s) => {
          const loc = s.locationId ? locations.find((l) => l.id === s.locationId) : undefined;
          return {
            key: s.locationId ? `loc:${s.locationId}` : `text:${(s.customLocationName || "").toLowerCase()}`,
            address: loc?.address || s.customLocationName,
            known: loc?.latitude && loc?.longitude ? { lat: loc.latitude, lng: loc.longitude } : undefined,
          };
        }),
      ];

      setIsCalculating(true);
      try {
        const coords = await Promise.all(points.map((p) => resolveCoords(p.key, p.address, p.known)));

        const legs = await Promise.all(
          stops.map(async (stop, i) => {
            if (!force && !stop.isAuto) return null;
            const from = coords[i];
            const to = coords[i + 1];
            if (!from || !to) return { miles: null };
            return { miles: await drivingMiles(from, to) };
          })
        );

        setStops((prev) =>
          prev.map((stop, i) => {
            const leg = legs[i];
            if (!leg) return stop;
            if (leg.miles === null) return { ...stop, autoFailed: true };
            return { ...stop, milesFromPrevious: leg.miles, isAuto: true, autoFailed: false };
          })
        );

        if (returnToStart) {
          const from = coords[coords.length - 1];
          const to = coords[0];
          setReturnMiles(from && to ? await drivingMiles(from, to) : 0);
        }
      } finally {
        setIsCalculating(false);
      }
    },
    [startWarehouseId, startAddress, stops, locations, returnToStart, resolveCoords]
  );

  // Debounced auto-calculation whenever the route shape changes
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      recalculate(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [stopSignature, open]);

  const handleAddStop = () => {
    setStops((prev) => [
      ...prev,
      { id: crypto.randomUUID(), locationId: undefined, customLocationName: undefined, milesFromPrevious: 0, isAuto: true },
    ]);
  };

  const handleUpdateStop = (
    index: number,
    data: { locationId?: string; customLocationName?: string; milesFromPrevious?: number; isAuto?: boolean }
  ) => {
    setStops((prev) => prev.map((stop, i) => (i === index ? { ...stop, ...data } : stop)));
  };

  const handleRemoveStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveStop = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= stops.length) return;
    setStops((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy.map((s) => (s.isAuto ? s : s));
    });
  };

  const totalMiles = stops.reduce((sum, s) => sum + s.milesFromPrevious, 0) + (returnToStart ? returnMiles : 0);

  const isValid =
    name.trim() &&
    startLabel.trim() &&
    stops.length >= 1 &&
    stops.every((s) => s.locationId || s.customLocationName?.trim());

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSaving(true);

    const stopsInput: RouteStopInput[] = [
      { customLocationName: startLabel.trim(), milesFromPrevious: 0 },
      ...stops.map((s) => ({
        locationId: s.locationId,
        customLocationName: s.locationId ? undefined : s.customLocationName?.trim(),
        milesFromPrevious: s.milesFromPrevious,
      })),
    ];

    if (returnToStart) {
      stopsInput.push({ customLocationName: startLabel.trim(), milesFromPrevious: returnMiles });
    }

    const freqDays = scheduleFrequency !== "none" ? parseInt(scheduleFrequency) : undefined;
    const dayOfWeek = scheduleFrequency !== "none" ? scheduleDayOfWeek : undefined;

    const success = await onSave(name.trim(), description.trim() || undefined, stopsInput, false, freqDays, dayOfWeek);

    setIsSaving(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            {route ? "Edit Route" : "Create Route"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-5 pr-1">
          {/* Route Details */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Route Name *</Label>
            <Input
              placeholder="e.g., Monday Collection, West Side Route"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Description (optional)</Label>
            <Textarea
              placeholder="Add notes about this route..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              rows={2}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Start */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <WarehouseIcon className="h-4 w-4 text-primary" />
              Start From
            </Label>
            <Select
              value={startWarehouseId}
              onValueChange={(value) => {
                setStartWarehouseId(value);
                const wh = warehouses.find((w) => w.id === value);
                setStartName(wh ? wh.name : "");
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select starting point" />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-popover">
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    <div className="flex items-center gap-2">
                      <WarehouseIcon className="h-3.5 w-3.5" />
                      <span>{w.name}{w.isDefault ? " (default)" : ""}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_START}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Custom starting point</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {startWarehouseId === CUSTOM_START ? (
              <Input
                placeholder="Enter starting address..."
                value={startName}
                onChange={(e) => setStartName(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="h-10"
              />
            ) : (
              <p className="text-xs text-muted-foreground truncate">{startAddress || "No address on this warehouse"}</p>
            )}
          </div>

          <Separator />

          {/* Stops */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Stops ({stops.length})</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => recalculate(true)}
                  disabled={isCalculating}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isCalculating ? "animate-spin" : ""}`} />
                  Recalculate
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleAddStop} className="h-8 gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Stop
                </Button>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
              {stops.map((stop, index) => (
                <RouteStopItem
                  key={stop.id}
                  index={index}
                  locationId={stop.locationId}
                  customLocationName={stop.customLocationName}
                  milesFromPrevious={stop.milesFromPrevious}
                  isAuto={stop.isAuto}
                  isCalculating={isCalculating && stop.isAuto}
                  autoFailed={stop.autoFailed}
                  locations={locations}
                  onUpdate={(data) => handleUpdateStop(index, data)}
                  onRemove={() => handleRemoveStop(index)}
                  onMove={(dir) => handleMoveStop(index, dir)}
                  canRemove={stops.length > 1}
                  canMoveUp={index > 0}
                  canMoveDown={index < stops.length - 1}
                />
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Return to {startLabel || "start"}</p>
                <p className="text-xs text-muted-foreground">
                  {returnToStart ? `${returnMiles.toFixed(1)} mi back` : "Route ends at the last stop"}
                </p>
              </div>
              <Switch checked={returnToStart} onCheckedChange={setReturnToStart} />
            </div>
          </div>

          <Separator />

          {/* Run Schedule */}
          <div className="space-y-3">
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
                  <SelectContent className="z-[100] bg-popover">
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
                  <SelectContent className="z-[100] bg-popover">
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
                Next run:{" "}
                <span className="font-medium text-foreground">{format(getNextScheduledDate()!, "EEEE, MMM d")}</span>
              </p>
            )}
          </div>

          <Separator />

          {/* Total */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Estimated Distance
                {isCalculating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </span>
              <span className="text-xl font-bold text-primary tabular-nums">{totalMiles.toFixed(1)} mi</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Driving estimate from map data — actual mileage is logged from your odometer.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 h-11" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button className="flex-1 h-11 gap-2" onClick={handleSubmit} disabled={!isValid || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : route ? (
                "Update Route"
              ) : (
                "Create Route"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
