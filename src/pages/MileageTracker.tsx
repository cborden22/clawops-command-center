import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  CalendarIcon, Plus, Trash2, Car, Route, DollarSign,
  Download, Sparkles, TrendingUp, AlertTriangle, Pencil, ChevronDown, ChevronRight,
  Navigation, Play
} from "lucide-react";
import { 
  format, subDays, startOfMonth, endOfMonth, isWithinInterval, 
  startOfWeek, endOfWeek, subWeeks, startOfYear, endOfYear, subYears,
  startOfQuarter, endOfQuarter, subQuarters
} from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useLocations } from "@/hooks/useLocationsDB";
import { useMileage, IRS_MILEAGE_RATE, MileageEntry } from "@/hooks/useMileageDB";
import { useRoutes } from "@/hooks/useRoutesDB";
import { useVehicles } from "@/hooks/useVehiclesDB";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useActiveTrip } from "@/hooks/useActiveTrip";
import { useRouteRun } from "@/hooks/useRouteRun";
import { RouteManager } from "@/components/mileage/RouteManager";
import { RouteRunPage } from "@/components/mileage/RouteRunPage";
import { LocationSelector, LocationSelection, getLocationDisplayString } from "@/components/mileage/LocationSelector";
import { TrackingModeSelector, TrackingMode } from "@/components/mileage/TrackingModeSelector";
import { ActiveTripCard } from "@/components/mileage/ActiveTripCard";
import { GpsTracker } from "@/components/mileage/GpsTracker";
import { RouteQuickSelector } from "@/components/mileage/RouteQuickSelector";
import { MileageRoute, RouteStop } from "@/hooks/useRoutesDB";
import { useNavigate, useSearchParams } from "react-router-dom";

type FilterPeriod = 
  | "past7days" 
  | "lastWeek" 
  | "thisWeek" 
  | "lastMonth" 
  | "thisMonth" 
  | "lastQuarter"
  | "thisQuarter"
  | "lastYear" 
  | "thisYear" 
  | "custom" 
  | "all";

const tripPurposes = [
  "Collection Run",
  "Restocking",
  "Maintenance",
  "New Location Visit",
  "Supply Pickup",
  "Meeting",
  "Other",
];

const MileageTracker = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeLocations, isLoaded: locationsLoaded } = useLocations();
  const { entries, addEntry, updateEntry, deleteEntry, calculateTotals, isLoaded: mileageLoaded, refetch: refetchMileage } = useMileage();
  const { routes, addRoute, updateRoute, deleteRoute, isLoaded: routesLoaded } = useRoutes();
  const { vehicles, updateVehicleOdometer, getVehicleById, isLoaded: vehiclesLoaded } = useVehicles();
  const { settings } = useAppSettings();
  const { 
    activeTrip, 
    isLoading: activeTripLoading, 
    startTrip, 
    updateTrip, 
    completeTrip, 
    discardTrip,
    refetch: refetchActiveTrip 
  } = useActiveTrip();
  const {
    activeRun,
    isLoading: routeRunLoading,
    startRouteRun,
    completeStop,
    completeRouteRun,
    discardRouteRun,
  } = useRouteRun();
  
  // Route run state
  const [routeRunRoute, setRouteRunRoute] = useState<MileageRoute | null>(null);
  
  // Tracking mode state
  const [trackingMode, setTrackingMode] = useState<TrackingMode>("odometer");
  const [isGpsTracking, setIsGpsTracking] = useState(false);
  
  // Form state - odometer only
  const [tripDate, setTripDate] = useState<Date>(new Date());
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [fromSelection, setFromSelection] = useState<LocationSelection>({ type: "warehouse" });
  const [toSelection, setToSelection] = useState<LocationSelection>({ type: "location" });
  const [odometerStart, setOdometerStart] = useState("");
  const [odometerEnd, setOdometerEnd] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  
  // Route template quick-start state
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  
  // Filter state
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("thisMonth");
  const [activeTab, setActiveTab] = useState("log");
  
  // Edit dialog state
  const [editingEntry, setEditingEntry] = useState<MileageEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editVehicleId, setEditVehicleId] = useState("");
  const [editFromSelection, setEditFromSelection] = useState<LocationSelection>({ type: "warehouse" });
  const [editToSelection, setEditToSelection] = useState<LocationSelection>({ type: "location" });
  const [editOdometerStart, setEditOdometerStart] = useState("");
  const [editOdometerEnd, setEditOdometerEnd] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);
  
  // Expandable row state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Auto-start route run from query param (e.g. from Quick Add menu)
  useEffect(() => {
    if (!routesLoaded) return;
    const runRouteId = searchParams.get("runRoute");
    if (runRouteId) {
      const matchedRoute = routes.find(r => r.id === runRouteId);
      if (matchedRoute) {
        setRouteRunRoute(matchedRoute);
        setActiveTab("routes");
      }
      // Clear the param
      searchParams.delete("runRoute");
      setSearchParams(searchParams, { replace: true });
    }
  }, [routesLoaded, searchParams]);
  
  // Calculate miles from odometer
  const startNum = parseFloat(odometerStart) || 0;
  const endNum = parseFloat(odometerEnd) || 0;
  const calculatedMiles = startNum && endNum && endNum > startNum ? endNum - startNum : null;
  const isEndLessThanStart = odometerEnd && odometerStart && endNum <= startNum;
  const isLargeJump = calculatedMiles !== null && calculatedMiles > 500;
  
  const selectedVehicle = selectedVehicleId ? getVehicleById(selectedVehicleId) : undefined;
  
  // Build warehouse address from settings
  const warehouseAddress = [
    settings.warehouseAddress,
    settings.warehouseCity,
    settings.warehouseState,
    settings.warehouseZip
  ].filter(Boolean).join(", ");

  const handleNavigateToSettings = () => {
    navigate("/settings");
  };

  // Helper to convert a route stop to LocationSelection
  const stopToLocationSelection = (
    stop: RouteStop
  ): LocationSelection => {
    if (stop.locationId) {
      return { type: "location", locationId: stop.locationId };
    }
    
    const customName = stop.customLocationName || "";
    
    // Check if this stop represents the warehouse
    if (customName === warehouseAddress || 
        customName.toLowerCase().includes("warehouse") ||
        customName.toLowerCase() === "starting point") {
      return { type: "warehouse" };
    }
    
    return { type: "custom", customName };
  };

  const resetForm = () => {
    setOdometerStart("");
    setOdometerEnd("");
    setPurpose("");
    setNotes("");
    setToSelection({ type: "location" });
    setIsGpsTracking(false);
    setSelectedRouteId(null);
    // Keep vehicle and from selection for convenience
  };

  // Handle From selection change - clears route if user manually changes
  const handleFromChange = (selection: LocationSelection) => {
    setFromSelection(selection);
    if (selectedRouteId) {
      setSelectedRouteId(null);
    }
  };

  // Handle To selection change - clears route if user manually changes
  const handleToChange = (selection: LocationSelection) => {
    setToSelection(selection);
    if (selectedRouteId) {
      setSelectedRouteId(null);
    }
  };

  // Handle route selection from quick selector
  const handleRouteSelect = (route: MileageRoute | null) => {
    if (!route) {
      setSelectedRouteId(null);
      return;
    }
    
    setSelectedRouteId(route.id);
    
    // Get first and last stops
    const firstStop = route.stops[0];
    const lastStop = route.stops[route.stops.length - 1];
    
    if (firstStop) {
      setFromSelection(stopToLocationSelection(firstStop));
    }
    
    if (lastStop) {
      setToSelection(stopToLocationSelection(lastStop));
    }
    
    // Set purpose to route name
    setPurpose(route.name);
  };

  // Start a new in-progress trip (for manual mode)
  const handleStartTrip = async () => {
    if (!selectedVehicleId) {
      toast({ title: "Vehicle Required", description: "Please select a vehicle.", variant: "destructive" });
      return;
    }
    
    const startLocationStr = getLocationDisplayString(fromSelection, activeLocations, warehouseAddress);
    const endLocationStr = getLocationDisplayString(toSelection, activeLocations, warehouseAddress);
    
    if (!startLocationStr) {
      toast({ title: "From Required", description: "Please select or enter a start location.", variant: "destructive" });
      return;
    }
    
    // If no route is selected, destination is required
    if (!selectedRouteId && !endLocationStr) {
      toast({ title: "To Required", description: "Please select a route or enter a destination.", variant: "destructive" });
      return;
    }
    
    // If route is selected, use route name as destination if To is empty
    const selectedRoute = selectedRouteId ? routes.find(r => r.id === selectedRouteId) : null;
    const finalEndLocation = endLocationStr || (selectedRoute ? `${selectedRoute.name} (Route)` : "");
    
    if (!odometerStart) {
      toast({ title: "Start Odometer Required", description: "Please enter your current odometer reading.", variant: "destructive" });
      return;
    }
    
    const startVal = parseFloat(odometerStart);
    if (isNaN(startVal)) {
      toast({ title: "Invalid Reading", description: "Please enter a valid odometer number.", variant: "destructive" });
      return;
    }
    
    const locationId = toSelection.type === "location" ? toSelection.locationId : undefined;
    
    setIsStartingTrip(true);
    const result = await startTrip({
      vehicleId: selectedVehicleId,
      startLocation: startLocationStr,
      endLocation: finalEndLocation,
      locationId,
      odometerStart: startVal,
      purpose: purpose.trim() || "Business Trip",
      notes: notes.trim(),
      trackingMode: "odometer",
    });
    
    if (result) {
      toast({ title: "Trip Started", description: "Enter end odometer when you arrive." });
      resetForm();
    }
    setIsStartingTrip(false);
  };

  // Start GPS tracking mode
  const handleStartGpsTracking = async () => {
    if (!selectedVehicleId) {
      toast({ title: "Vehicle Required", description: "Please select a vehicle.", variant: "destructive" });
      return;
    }
    
    const startLocationStr = getLocationDisplayString(fromSelection, activeLocations, warehouseAddress);
    const endLocationStr = getLocationDisplayString(toSelection, activeLocations, warehouseAddress);
    
    if (!startLocationStr) {
      toast({ title: "From Required", description: "Please select or enter a start location.", variant: "destructive" });
      return;
    }
    
    // If no route is selected, destination is required
    if (!selectedRouteId && !endLocationStr) {
      toast({ title: "To Required", description: "Please select a route or enter a destination.", variant: "destructive" });
      return;
    }
    
    // If route is selected, use route name as destination if To is empty
    const selectedRoute = selectedRouteId ? routes.find(r => r.id === selectedRouteId) : null;
    const finalEndLocation = endLocationStr || (selectedRoute ? `${selectedRoute.name} (Route)` : "");
    
    const locationId = toSelection.type === "location" ? toSelection.locationId : undefined;
    
    // Start the trip first
    const result = await startTrip({
      vehicleId: selectedVehicleId,
      startLocation: startLocationStr,
      endLocation: finalEndLocation,
      locationId,
      odometerStart: 0, // GPS mode doesn't use odometer
      purpose: purpose.trim() || "Business Trip",
      notes: notes.trim(),
      trackingMode: "gps",
    });
    
    if (result) {
      setIsGpsTracking(true);
    }
  };

  // Handle GPS tracking completion
  const handleGpsComplete = async (data: {
    distanceMiles: number;
    gpsDistanceMeters: number;
    startLat?: number;
    startLng?: number;
    endLat?: number;
    endLng?: number;
  }) => {
    const success = await completeTrip({
      gpsDistanceMeters: data.gpsDistanceMeters,
      gpsEndLat: data.endLat,
      gpsEndLng: data.endLng,
    });
    
    if (success) {
      setIsGpsTracking(false);
      resetForm();
      refetchMileage();
    }
  };

  // Handle active trip completion (manual mode)
  const handleCompleteActiveTrip = async (odometerEnd: number): Promise<boolean> => {
    const success = await completeTrip({ odometerEnd });
    if (success) {
      refetchMileage();
    }
    return success;
  };

  // Handle active trip discard
  const handleDiscardTrip = async (): Promise<boolean> => {
    const success = await discardTrip();
    if (success) {
      setIsGpsTracking(false);
    }
    return success;
  };

  const handleAddEntry = async () => {
    // Validation
    if (!selectedVehicleId) {
      toast({ title: "Vehicle Required", description: "Please select a vehicle.", variant: "destructive" });
      return;
    }
    
    const startLocationStr = getLocationDisplayString(fromSelection, activeLocations, warehouseAddress);
    const endLocationStr = getLocationDisplayString(toSelection, activeLocations, warehouseAddress);
    
    if (!startLocationStr) {
      toast({ title: "From Required", description: "Please select or enter a start location.", variant: "destructive" });
      return;
    }
    
    // If no route is selected, destination is required
    if (!selectedRouteId && !endLocationStr) {
      toast({ title: "To Required", description: "Please select a route or enter a destination.", variant: "destructive" });
      return;
    }
    
    // If route is selected, use route name as destination if To is empty
    const selectedRoute = selectedRouteId ? routes.find(r => r.id === selectedRouteId) : null;
    const finalEndLocation = endLocationStr || (selectedRoute ? `${selectedRoute.name} (Route)` : "");
    
    if (!odometerStart || !odometerEnd) {
      toast({ title: "Odometer Required", description: "Please enter both odometer readings.", variant: "destructive" });
      return;
    }
    
    const startVal = parseFloat(odometerStart);
    const endVal = parseFloat(odometerEnd);
    
    if (isNaN(startVal) || isNaN(endVal)) {
      toast({ title: "Invalid Readings", description: "Please enter valid odometer numbers.", variant: "destructive" });
      return;
    }
    
    if (endVal <= startVal) {
      toast({ title: "Invalid Range", description: "End odometer must be greater than start.", variant: "destructive" });
      return;
    }
    
    const milesToLog = endVal - startVal;
    
    // Get location ID if a saved location was selected
    const locationId = toSelection.type === "location" ? toSelection.locationId : undefined;

    const result = await addEntry({
      date: tripDate,
      startLocation: startLocationStr,
      endLocation: finalEndLocation,
      locationId,
      miles: milesToLog,
      purpose: purpose.trim(),
      notes: notes.trim(),
      isRoundTrip: false, // Always false now - odometer captures actual miles
      vehicleId: selectedVehicleId,
      odometerStart: startVal,
      odometerEnd: endVal,
    });
    
    // Update vehicle's last recorded odometer
    if (result && selectedVehicleId) {
      await updateVehicleOdometer(selectedVehicleId, endVal);
    }

    resetForm();

    toast({ 
      title: "Trip Logged", 
      description: `${milesToLog.toFixed(1)} miles recorded` 
    });
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
    toast({ title: "Trip Removed" });
  };

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Helper to derive LocationSelection from entry for editing
  const getLocationSelectionFromEntry = (
    locationStr: string,
    isFrom: boolean
  ): LocationSelection => {
    // Check if it matches warehouse
    if (locationStr === warehouseAddress && warehouseAddress) {
      return { type: "warehouse" };
    }
    
    // Check if it matches a saved location
    const matchedLocation = activeLocations.find(
      loc => loc.name === locationStr || loc.address === locationStr
    );
    if (matchedLocation) {
      return { type: "location", locationId: matchedLocation.id };
    }
    
    // Otherwise it's custom
    return { type: "custom", customName: locationStr };
  };

  // Open edit dialog with entry data
  const handleOpenEditDialog = (entry: MileageEntry) => {
    setEditingEntry(entry);
    setEditDate(entry.date);
    setEditVehicleId(entry.vehicleId || "");
    setEditFromSelection(getLocationSelectionFromEntry(entry.startLocation, true));
    setEditToSelection(getLocationSelectionFromEntry(entry.endLocation, false));
    setEditOdometerStart(entry.odometerStart?.toString() || "");
    setEditOdometerEnd(entry.odometerEnd?.toString() || "");
    setEditPurpose(entry.purpose || "");
    setEditNotes(entry.notes || "");
    setIsEditDialogOpen(true);
  };

  // Edit form calculated values
  const editStartNum = parseFloat(editOdometerStart) || 0;
  const editEndNum = parseFloat(editOdometerEnd) || 0;
  const editCalculatedMiles = editStartNum && editEndNum && editEndNum > editStartNum 
    ? editEndNum - editStartNum 
    : null;
  const editIsEndLessThanStart = editOdometerEnd && editOdometerStart && editEndNum <= editStartNum;

  // Save edited entry
  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    
    // Validation
    if (!editVehicleId) {
      toast({ title: "Vehicle Required", description: "Please select a vehicle.", variant: "destructive" });
      return;
    }
    
    const startLocationStr = getLocationDisplayString(editFromSelection, activeLocations, warehouseAddress);
    const endLocationStr = getLocationDisplayString(editToSelection, activeLocations, warehouseAddress);
    
    if (!startLocationStr) {
      toast({ title: "From Required", description: "Please select or enter a start location.", variant: "destructive" });
      return;
    }
    
    if (!endLocationStr) {
      toast({ title: "To Required", description: "Please select or enter a destination.", variant: "destructive" });
      return;
    }
    
    if (!editOdometerStart || !editOdometerEnd) {
      toast({ title: "Odometer Required", description: "Please enter both odometer readings.", variant: "destructive" });
      return;
    }
    
    const startVal = parseFloat(editOdometerStart);
    const endVal = parseFloat(editOdometerEnd);
    
    if (isNaN(startVal) || isNaN(endVal)) {
      toast({ title: "Invalid Readings", description: "Please enter valid odometer numbers.", variant: "destructive" });
      return;
    }
    
    if (endVal <= startVal) {
      toast({ title: "Invalid Range", description: "End odometer must be greater than start.", variant: "destructive" });
      return;
    }
    
    setIsEditSaving(true);
    
    const milesToLog = endVal - startVal;
    const locationId = editToSelection.type === "location" ? editToSelection.locationId : undefined;
    
    const result = await updateEntry(editingEntry.id, {
      date: editDate,
      startLocation: startLocationStr,
      endLocation: endLocationStr,
      locationId,
      miles: milesToLog,
      purpose: editPurpose.trim(),
      notes: editNotes.trim(),
      vehicleId: editVehicleId,
      odometerStart: startVal,
      odometerEnd: endVal,
    });
    
    // Update vehicle's last recorded odometer if it's higher
    if (result && editVehicleId) {
      const vehicle = getVehicleById(editVehicleId);
      if (!vehicle?.lastRecordedOdometer || endVal > vehicle.lastRecordedOdometer) {
        await updateVehicleOdometer(editVehicleId, endVal);
      }
    }
    
    setIsEditSaving(false);
    setIsEditDialogOpen(false);
    setEditingEntry(null);
    
    toast({ 
      title: "Trip Updated", 
      description: `${milesToLog.toFixed(1)} miles saved` 
    });
  };

  // Get vehicle name for display
  const getVehicleName = (vehicleId?: string) => {
    if (!vehicleId) return "-";
    const vehicle = getVehicleById(vehicleId);
    return vehicle?.name || "-";
  };

  const getDateRange = (period: FilterPeriod): { start: Date; end: Date } | null => {
    const now = new Date();
    
    switch (period) {
      case "past7days":
        return { start: subDays(now, 7), end: now };
      case "lastWeek":
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
        return { start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }), end: lastWeekEnd };
      case "thisWeek":
        return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) };
      case "lastMonth":
        const lastMonth = subDays(startOfMonth(now), 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "thisMonth":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "lastQuarter":
        const lastQ = subQuarters(now, 1);
        return { start: startOfQuarter(lastQ), end: endOfQuarter(lastQ) };
      case "thisQuarter":
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case "lastYear":
        const lastYear = subYears(now, 1);
        return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
      case "thisYear":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "all":
      default:
        return null;
    }
  };

  const getFilteredEntries = () => {
    let filtered = [...entries];
    
    const range = getDateRange(filterPeriod);
    if (range) {
      filtered = filtered.filter(e => isWithinInterval(e.date, { start: range.start, end: range.end }));
    }
    
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const filteredEntries = getFilteredEntries();
  const { totalMiles, taxDeduction, tripCount } = calculateTotals(filteredEntries);

  const handleExport = () => {
    if (filteredEntries.length === 0) {
      toast({ title: "No Data", description: "No trips to export.", variant: "destructive" });
      return;
    }

    const headers = ["Date", "From", "To", "Miles", "Purpose", "Odometer Start", "Odometer End", "Notes"];
    const csvRows = [headers.join(",")];

    filteredEntries.forEach(entry => {
      const row = [
        format(entry.date, "yyyy-MM-dd"),
        `"${entry.startLocation.replace(/"/g, '""')}"`,
        `"${entry.endLocation.replace(/"/g, '""')}"`,
        entry.miles.toFixed(1),
        `"${(entry.purpose || "").replace(/"/g, '""')}"`,
        entry.odometerStart?.toString() || "",
        entry.odometerEnd?.toString() || "",
        `"${(entry.notes || "").replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });

    // Add summary row
    csvRows.push("");
    csvRows.push(`Total Miles,${totalMiles.toFixed(1)}`);
    csvRows.push(`Tax Deduction (@ $${IRS_MILEAGE_RATE}/mi),$${taxDeduction.toFixed(2)}`);

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const range = getDateRange(filterPeriod);
    const startStr = range ? format(range.start, "yyyy-MM-dd") : "all";
    const endStr = range ? format(range.end, "yyyy-MM-dd") : "time";
    link.href = url;
    link.download = `routes-export-${startStr}-to-${endStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Export Complete", description: `Exported ${filteredEntries.length} trips to CSV.` });
  };

  const handleUseRoute = (route: MileageRoute) => {
    setActiveTab("log");
    handleRouteSelect(route);
  };

  const handleRunRoute = (route: MileageRoute) => {
    setRouteRunRoute(route);
    setActiveTab("routes");
  };

  const handleExitRouteRun = () => {
    setRouteRunRoute(null);
  };

  if (!locationsLoaded || !mileageLoaded || !routesLoaded || !vehiclesLoaded) {
    return (
      <div className="bg-background">
        <div className="container mx-auto py-4 sm:py-8 px-4">
          <div className="flex items-center justify-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Routes</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Log business trips for tax deductions (${IRS_MILEAGE_RATE}/mile IRS rate)
          </p>
        </div>

        <div className="space-y-6 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
              <CardContent className="pt-6 relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="flex items-center gap-4 relative">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Route className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Miles</p>
                    <p className="text-2xl font-bold text-foreground tracking-tight">{totalMiles.toFixed(1)} mi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
              <CardContent className="pt-6 relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="flex items-center gap-4 relative">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tax Deduction</p>
                    <p className="text-2xl font-bold text-foreground tracking-tight">~${taxDeduction.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
              <CardContent className="pt-6 relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="flex items-center gap-4 relative">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-muted to-muted/80 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Car className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trips</p>
                    <p className="text-2xl font-bold text-foreground tracking-tight">{tripCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="log" className="gap-2">
                <Plus className="h-4 w-4" />
                Log Trip
              </TabsTrigger>
              <TabsTrigger value="routes" className="gap-2">
                <Route className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Log Trip Tab */}
            <TabsContent value="log" className="space-y-6">
              {/* Active Trip Card - shown if there's an in-progress trip */}
              {activeTrip && !isGpsTracking && activeTrip.trackingMode === "odometer" && (
                <ActiveTripCard
                  trip={activeTrip}
                  onComplete={handleCompleteActiveTrip}
                  onDiscard={handleDiscardTrip}
                  onUpdateOdometer={(odometerEnd) => updateTrip({ odometerEnd })}
                />
              )}

              {/* GPS Tracking UI - shown when GPS tracking is active */}
              {activeTrip && (isGpsTracking || activeTrip.trackingMode === "gps") && (
                <Card className="glass-card overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Navigation className="h-4 w-4 text-primary" />
                      </div>
                      GPS Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <GpsTracker
                      destination={activeTrip.endLocation}
                      onComplete={handleGpsComplete}
                      onCancel={handleDiscardTrip}
                    />
                  </CardContent>
                </Card>
              )}

              {/* New Trip Form - shown when no active trip */}
              {!activeTrip && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-card overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        Start a Trip
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      {/* Tracking Mode Selector */}
                      <TrackingModeSelector
                        value={trackingMode}
                        onChange={setTrackingMode}
                        disabled={isStartingTrip}
                      />

                      {/* Vehicle Selector */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Vehicle *</Label>
                        {vehicles.length === 0 ? (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              No vehicles added.{" "}
                              <Button variant="link" className="p-0 h-auto text-amber-600 dark:text-amber-400 underline" onClick={handleNavigateToSettings}>
                                Add one in Settings
                              </Button>
                            </p>
                          </div>
                        ) : (
                          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select a vehicle..." />
                            </SelectTrigger>
                            <SelectContent className="bg-background border border-border z-50">
                              {vehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  <div className="flex items-center gap-2">
                                    <Car className="h-4 w-4" />
                                    <span>{vehicle.name}</span>
                                    {vehicle.licensePlate && (
                                      <span className="text-muted-foreground text-xs">({vehicle.licensePlate})</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {selectedVehicle?.lastRecordedOdometer !== undefined && trackingMode === "odometer" && (
                          <p className="text-xs text-muted-foreground pl-1">
                            Last recorded: {selectedVehicle.lastRecordedOdometer.toLocaleString()} miles
                          </p>
                        )}
                      </div>

                      {/* Route Quick Selector */}
                      <RouteQuickSelector
                        routes={routes}
                        selectedRouteId={selectedRouteId}
                        onSelectRoute={handleRouteSelect}
                        locations={activeLocations}
                        warehouseAddress={warehouseAddress}
                      />

                      {/* Only show manual From/To if no route is selected */}
                      {!selectedRouteId && (
                        <>
                          {/* From Location */}
                          <LocationSelector
                            type="from"
                            value={fromSelection}
                            onChange={handleFromChange}
                            locations={activeLocations}
                            warehouseAddress={warehouseAddress}
                          />

                          {/* To Location */}
                          <LocationSelector
                            type="to"
                            value={toSelection}
                            onChange={handleToChange}
                            locations={activeLocations}
                            warehouseAddress={warehouseAddress}
                          />
                        </>
                      )}
                      
                      {/* Show route summary when route is selected */}
                      {selectedRouteId && (
                        <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Route Selected</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRouteId(null);
                                setFromSelection({ type: "warehouse" });
                                setToSelection({ type: "location" });
                                setPurpose("");
                              }}
                              className="h-7 text-xs"
                            >
                              Clear
                            </Button>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{getLocationDisplayString(fromSelection, activeLocations, warehouseAddress)}</span>
                            <span className="text-muted-foreground mx-2">→</span>
                            <span className="font-medium">{getLocationDisplayString(toSelection, activeLocations, warehouseAddress)}</span>
                          </div>
                        </div>
                      )}

                      {/* Start Odometer - only for manual mode */}
                      {trackingMode === "odometer" && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Start Odometer *</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            placeholder="e.g., 45276"
                            value={odometerStart}
                            onChange={(e) => setOdometerStart(e.target.value)}
                            className="h-14 text-xl font-semibold text-center"
                            onFocus={(e) => e.target.select()}
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter your current odometer reading. You'll enter the end reading when you complete the trip.
                          </p>
                        </div>
                      )}

                      {/* Purpose */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Purpose</Label>
                        <Select value={purpose} onValueChange={setPurpose}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select purpose..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border z-50">
                            {tripPurposes.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Notes (optional)</Label>
                        <Textarea
                          placeholder="Additional details..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                        />
                      </div>

                      {/* Start Trip Button */}
                      {trackingMode === "odometer" ? (
                        <Button 
                          onClick={handleStartTrip} 
                          className="w-full h-12 gap-2"
                          disabled={!selectedVehicleId || !odometerStart || isStartingTrip}
                        >
                          {isStartingTrip ? (
                            <>Starting...</>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Start Trip
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleStartGpsTracking} 
                          className="w-full h-12 gap-2"
                          disabled={!selectedVehicleId}
                        >
                          <Navigation className="h-4 w-4" />
                          Start GPS Tracking
                        </Button>
                      )}

                      <p className="text-xs text-center text-muted-foreground">
                        {trackingMode === "odometer" 
                          ? "Your trip will be saved. Return here to enter your end odometer when done."
                          : "GPS will track your distance automatically. Make sure location is enabled."
                        }
                      </p>
                    </CardContent>
                  </Card>

                  {/* Recent Trips Preview */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Recent Trips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {entries.filter(e => e.miles > 0).slice(0, 5).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No trips logged yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {entries.filter(e => e.miles > 0).slice(0, 5).map(entry => (
                            <div 
                              key={entry.id} 
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{format(entry.date, "MM/dd")}</span>
                                  <span className="text-sm text-muted-foreground truncate">
                                    {entry.startLocation} → {entry.endLocation}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="secondary">{entry.miles.toFixed(1)} mi</Badge>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => setActiveTab("history")}
                          >
                            View All History
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Show recent trips when active trip exists */}
              {activeTrip && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Recent Trips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {entries.filter(e => e.miles > 0).slice(0, 3).length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">No completed trips yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {entries.filter(e => e.miles > 0).slice(0, 3).map(entry => (
                          <div 
                            key={entry.id} 
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{format(entry.date, "MM/dd")}</span>
                              <span className="text-muted-foreground truncate max-w-[150px]">
                                → {entry.endLocation}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">{entry.miles.toFixed(1)} mi</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Routes Tab */}
            <TabsContent value="routes">
              {(routeRunRoute || activeRun) && (routeRunRoute || routes.find(r => r.id === activeRun?.routeId)) ? (
                <RouteRunPage
                  route={(routeRunRoute || routes.find(r => r.id === activeRun?.routeId))!}
                  vehicles={vehicles}
                  activeRun={activeRun}
                  onStartRun={startRouteRun}
                  onCompleteStop={completeStop}
                  onCompleteRun={completeRouteRun}
                  onDiscardRun={discardRouteRun}
                  onExit={handleExitRouteRun}
                  refetchMileage={refetchMileage}
                />
              ) : (
                <RouteManager
                  routes={routes}
                  onAddRoute={addRoute}
                  onUpdateRoute={updateRoute}
                  onDeleteRoute={deleteRoute}
                  onUseRoute={handleUseRoute}
                  onRunRoute={handleRunRoute}
                  hasActiveRun={!!activeRun}
                />
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Trip History
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50">
                        <SelectItem value="past7days">Past 7 Days</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="lastWeek">Last Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="lastMonth">Last Month</SelectItem>
                        <SelectItem value="thisQuarter">This Quarter</SelectItem>
                        <SelectItem value="lastQuarter">Last Quarter</SelectItem>
                        <SelectItem value="thisYear">This Year</SelectItem>
                        <SelectItem value="lastYear">Last Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredEntries.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Car className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No trips logged for this period</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="w-[40px]"></TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="hidden sm:table-cell">Vehicle</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead className="text-right">Miles</TableHead>
                            <TableHead className="hidden md:table-cell">Purpose</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEntries.map(entry => {
                            const isExpanded = expandedRows.has(entry.id);
                            return (
                              <>
                                <TableRow 
                                  key={entry.id} 
                                  className="hover:bg-muted/20 cursor-pointer"
                                  onClick={() => toggleRowExpansion(entry.id)}
                                >
                                  <TableCell className="p-2">
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {format(entry.date, "MM/dd")}
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                                    {getVehicleName(entry.vehicleId)}
                                  </TableCell>
                                  <TableCell className="max-w-[120px] truncate">
                                    {entry.startLocation}
                                  </TableCell>
                                  <TableCell className="max-w-[120px] truncate">
                                    {entry.endLocation}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {entry.miles.toFixed(1)}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell max-w-[100px] truncate text-muted-foreground">
                                    {entry.purpose || "-"}
                                  </TableCell>
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => handleOpenEditDialog(entry)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive/70 hover:text-destructive"
                                        onClick={() => handleDeleteEntry(entry.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                {isExpanded && (
                                  <TableRow key={`${entry.id}-details`} className="bg-muted/10">
                                    <TableCell colSpan={8} className="py-3">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Vehicle</p>
                                          <p className="text-sm font-medium">{getVehicleName(entry.vehicleId)}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Odometer</p>
                                          <p className="text-sm font-medium">
                                            {entry.odometerStart?.toLocaleString() || "-"} → {entry.odometerEnd?.toLocaleString() || "-"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Purpose</p>
                                          <p className="text-sm font-medium">{entry.purpose || "-"}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                          <p className="text-sm font-medium">{entry.notes || "-"}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pencil className="h-5 w-5" />
                  Edit Trip Entry
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(editDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100] bg-background border border-border">
                      <Calendar
                        mode="single"
                        selected={editDate}
                        onSelect={(date) => date && setEditDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Vehicle Selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vehicle *</Label>
                  <Select value={editVehicleId} onValueChange={setEditVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vehicle..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-[100]">
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* From Location */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">From *</Label>
                  <LocationSelector
                    type="from"
                    value={editFromSelection}
                    onChange={setEditFromSelection}
                    locations={activeLocations}
                    warehouseAddress={warehouseAddress}
                  />
                </div>

                {/* To Location */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">To *</Label>
                  <LocationSelector
                    type="to"
                    value={editToSelection}
                    onChange={setEditToSelection}
                    locations={activeLocations}
                    warehouseAddress={warehouseAddress}
                  />
                </div>

                {/* Odometer Readings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Start Odometer *</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 45230"
                      value={editOdometerStart}
                      onChange={(e) => setEditOdometerStart(e.target.value)}
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">End Odometer *</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 45276"
                      value={editOdometerEnd}
                      onChange={(e) => setEditOdometerEnd(e.target.value)}
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Calculated Miles Display */}
                {editCalculatedMiles !== null && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Calculated Miles:</span>
                      <span className="text-lg font-bold text-primary">
                        {editCalculatedMiles.toFixed(1)} mi
                      </span>
                    </div>
                  </div>
                )}

                {editIsEndLessThanStart && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>End odometer must be greater than start</span>
                  </div>
                )}

                {/* Purpose */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Purpose</Label>
                  <Select value={editPurpose} onValueChange={setEditPurpose}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-[100]">
                      {tripPurposes.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notes</Label>
                  <Textarea
                    placeholder="Additional details..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isEditSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={isEditSaving || !editVehicleId || !editOdometerStart || !editOdometerEnd || !!editIsEndLessThanStart}
                >
                  {isEditSaving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default MileageTracker;
