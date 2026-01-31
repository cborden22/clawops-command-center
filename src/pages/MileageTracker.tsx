import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarIcon, Plus, Trash2, Car, MapPin, Route, DollarSign,
  Download, Sparkles, TrendingUp, X
} from "lucide-react";
import { 
  format, subDays, startOfMonth, endOfMonth, isWithinInterval, 
  startOfWeek, endOfWeek, subWeeks, startOfYear, endOfYear, subYears,
  startOfQuarter, endOfQuarter, subQuarters
} from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useLocations } from "@/hooks/useLocationsDB";
import { useMileage, IRS_MILEAGE_RATE } from "@/hooks/useMileageDB";
import { useRoutes, MileageRoute } from "@/hooks/useRoutesDB";
import { useVehicles } from "@/hooks/useVehiclesDB";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { RouteManager } from "@/components/mileage/RouteManager";
import { RoutePreview } from "@/components/mileage/RoutePreview";
import { OdometerModeInputs, useOdometerCalculation } from "@/components/mileage/OdometerModeInputs";
import { useNavigate } from "react-router-dom";

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

const MileageTracker = () => {
  const navigate = useNavigate();
  const { activeLocations, getLocationById, isLoaded: locationsLoaded } = useLocations();
  const { entries, addEntry, deleteEntry, calculateTotals, isLoaded: mileageLoaded } = useMileage();
  const { routes, addRoute, updateRoute, deleteRoute, getRouteById, isLoaded: routesLoaded } = useRoutes();
  const { vehicles, updateVehicleOdometer, isLoaded: vehiclesLoaded } = useVehicles();
  const { settings, updateSetting } = useAppSettings();
  
  // Form state
  const [tripDate, setTripDate] = useState<Date>(new Date());
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [miles, setMiles] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  
  // Odometer mode state
  const [odometerMode, setOdometerMode] = useState(settings.preferOdometerMode);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [odometerStart, setOdometerStart] = useState("");
  const [odometerEnd, setOdometerEnd] = useState("");
  
  const calculatedMiles = useOdometerCalculation(odometerMode, odometerStart, odometerEnd);
  
  // Filter state
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("thisMonth");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  // Tab state
  const [activeTab, setActiveTab] = useState("log");
  
  // Sync odometer mode preference
  useEffect(() => {
    if (odometerMode !== settings.preferOdometerMode) {
      updateSetting("preferOdometerMode", odometerMode);
    }
  }, [odometerMode]);

  const handleQuickSelectLocation = (locationId: string) => {
    const loc = getLocationById(locationId);
    if (loc) {
      setEndLocation(loc.name + (loc.address ? ` - ${loc.address}` : ""));
      setSelectedLocationId(locationId);
    }
  };

  const handleRouteSelect = (routeId: string) => {
    if (!routeId) {
      handleClearRoute();
      return;
    }

    const route = getRouteById(routeId);
    if (!route || route.stops.length < 2) return;

    const firstStop = route.stops[0];
    const lastStop = route.stops[route.stops.length - 1];

    // Get start location name
    let startName = "";
    if (firstStop.locationId) {
      const loc = getLocationById(firstStop.locationId);
      startName = loc?.name || "Unknown";
    } else {
      startName = firstStop.customLocationName || "Unknown";
    }

    // Get end location name
    let endName = "";
    if (lastStop.locationId) {
      const loc = getLocationById(lastStop.locationId);
      endName = loc?.name || "Unknown";
      setSelectedLocationId(lastStop.locationId);
    } else {
      endName = lastStop.customLocationName || "Unknown";
      setSelectedLocationId("");
    }

    // Calculate one-way miles
    const oneWayMiles = route.stops.reduce((sum, s) => sum + s.milesFromPrevious, 0);

    setSelectedRouteId(routeId);
    setStartLocation(startName);
    setEndLocation(endName);
    setMiles(oneWayMiles.toString());
    setIsRoundTrip(route.isRoundTrip);
    setPurpose(route.name);
  };

  const handleClearRoute = () => {
    setSelectedRouteId("");
    setStartLocation("");
    setEndLocation("");
    setSelectedLocationId("");
    setMiles("");
    setPurpose("");
    setIsRoundTrip(false);
  };
  
  const handleClearOdometerForm = () => {
    setOdometerStart("");
    setOdometerEnd("");
    setSelectedVehicleId("");
  };

  const handleUseRoute = (route: MileageRoute) => {
    setActiveTab("log");
    handleRouteSelect(route.id);
  };
  
  const handleNavigateToSettings = () => {
    navigate("/settings");
  };

  const handleAddEntry = async () => {
    // Determine the miles to use
    let milesToLog: number;
    let vehicleIdToLog: string | undefined;
    let odometerStartVal: number | undefined;
    let odometerEndVal: number | undefined;
    
    if (odometerMode) {
      // Odometer mode validation
      if (!odometerStart || !odometerEnd) {
        toast({ 
          title: "Missing Odometer Readings", 
          description: "Please enter both start and end odometer readings.",
          variant: "destructive" 
        });
        return;
      }
      
      const startVal = parseFloat(odometerStart);
      const endVal = parseFloat(odometerEnd);
      
      if (isNaN(startVal) || isNaN(endVal)) {
        toast({ 
          title: "Invalid Readings", 
          description: "Please enter valid odometer numbers.",
          variant: "destructive" 
        });
        return;
      }
      
      if (endVal <= startVal) {
        toast({ 
          title: "Invalid Range", 
          description: "End odometer must be greater than start.",
          variant: "destructive" 
        });
        return;
      }
      
      milesToLog = endVal - startVal;
      vehicleIdToLog = selectedVehicleId || undefined;
      odometerStartVal = startVal;
      odometerEndVal = endVal;
      
      // Apply round trip if selected
      if (isRoundTrip) {
        milesToLog = milesToLog * 2;
      }
    } else {
      // Manual miles mode validation
      if (!miles) {
        toast({ 
          title: "Missing Miles", 
          description: "Please enter the miles driven.",
          variant: "destructive" 
        });
        return;
      }
      
      const parsedMiles = parseFloat(miles);
      if (isNaN(parsedMiles) || parsedMiles <= 0) {
        toast({ 
          title: "Invalid Miles", 
          description: "Please enter a valid number of miles.",
          variant: "destructive" 
        });
        return;
      }
      
      milesToLog = isRoundTrip ? parsedMiles * 2 : parsedMiles;
    }
    
    if (!startLocation || !endLocation) {
      toast({ 
        title: "Missing Locations", 
        description: "Please fill in start and end locations.",
        variant: "destructive" 
      });
      return;
    }

    const result = await addEntry({
      date: tripDate,
      startLocation,
      endLocation,
      locationId: selectedLocationId || undefined,
      miles: milesToLog,
      purpose: purpose.trim(),
      notes: notes.trim(),
      isRoundTrip,
      vehicleId: vehicleIdToLog,
      odometerStart: odometerStartVal,
      odometerEnd: odometerEndVal,
    });
    
    // Update vehicle's last recorded odometer if in odometer mode
    if (result && odometerMode && vehicleIdToLog && odometerEndVal) {
      await updateVehicleOdometer(vehicleIdToLog, odometerEndVal);
    }

    // Reset form
    setMiles("");
    setPurpose("");
    setNotes("");
    setEndLocation("");
    setSelectedLocationId("");
    setIsRoundTrip(false);
    setSelectedRouteId("");
    setStartLocation("");
    handleClearOdometerForm();

    toast({ 
      title: "Trip Logged", 
      description: `${milesToLog.toFixed(1)} miles recorded${isRoundTrip ? " (round trip)" : ""}${odometerMode ? " via odometer" : ""}` 
    });
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
    toast({ title: "Trip Removed" });
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
      case "custom":
        if (customStartDate && customEndDate) {
          return { start: customStartDate, end: customEndDate };
        }
        return null;
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

    const headers = ["Date", "From", "To", "Miles", "Purpose", "Round Trip", "Notes"];
    const csvRows = [headers.join(",")];

    filteredEntries.forEach(entry => {
      const row = [
        format(entry.date, "yyyy-MM-dd"),
        `"${entry.startLocation.replace(/"/g, '""')}"`,
        `"${entry.endLocation.replace(/"/g, '""')}"`,
        entry.miles.toFixed(1),
        `"${(entry.purpose || "").replace(/"/g, '""')}"`,
        entry.isRoundTrip ? "Yes" : "No",
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
    link.download = `mileage-export-${startStr}-to-${endStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Export Complete", description: `Exported ${filteredEntries.length} trips to CSV.` });
  };

  const selectedRoute = selectedRouteId ? getRouteById(selectedRouteId) : undefined;

  if (!locationsLoaded || !mileageLoaded || !routesLoaded || !vehiclesLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mileage Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Track business travel for tax deductions (${IRS_MILEAGE_RATE}/mile IRS rate)
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
                Routes
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Log Trip Tab */}
            <TabsContent value="log" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      Log Trip
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {/* Route Quick Select */}
                    {routes.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Quick Select Route</Label>
                        <div className="flex gap-2">
                          <Select value={selectedRouteId} onValueChange={handleRouteSelect}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select a saved route..." />
                            </SelectTrigger>
                            <SelectContent>
                              {routes.map(route => (
                                <SelectItem key={route.id} value={route.id}>
                                  <div className="flex items-center gap-2">
                                    <Route className="h-3 w-3" />
                                    {route.name} ({route.totalMiles.toFixed(1)} mi)
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedRouteId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleClearRoute}
                              className="flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {selectedRoute && (
                          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                            <RoutePreview route={selectedRoute} compact />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Date */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(tripDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={tripDate}
                            onSelect={(date) => date && setTripDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Odometer Mode Inputs */}
                    <OdometerModeInputs
                      enabled={odometerMode}
                      onEnabledChange={setOdometerMode}
                      selectedVehicleId={selectedVehicleId}
                      onVehicleChange={setSelectedVehicleId}
                      odometerStart={odometerStart}
                      onOdometerStartChange={setOdometerStart}
                      odometerEnd={odometerEnd}
                      onOdometerEndChange={setOdometerEnd}
                      calculatedMiles={calculatedMiles}
                      onAddVehicle={handleNavigateToSettings}
                    />

                    {/* Round Trip Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium cursor-pointer">Round Trip</Label>
                      </div>
                      <Switch checked={isRoundTrip} onCheckedChange={setIsRoundTrip} />
                    </div>
                    {isRoundTrip && odometerMode && calculatedMiles !== null && calculatedMiles > 0 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Total with round trip: {(calculatedMiles * 2).toFixed(1)} miles
                      </p>
                    )}

                    {/* Start Location */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">From</Label>
                      <Input
                        placeholder="e.g., Home, Warehouse"
                        value={startLocation}
                        onChange={(e) => setStartLocation(e.target.value)}
                      />
                    </div>

                    {/* End Location */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">To</Label>
                      <Input
                        placeholder="Destination"
                        value={endLocation}
                        onChange={(e) => {
                          setEndLocation(e.target.value);
                          setSelectedLocationId("");
                        }}
                      />
                      {activeLocations.length > 0 && (
                        <Select value={selectedLocationId} onValueChange={handleQuickSelectLocation}>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Or select saved location..." />
                          </SelectTrigger>
                          <SelectContent>
                            {activeLocations.map(loc => (
                              <SelectItem key={loc.id} value={loc.id}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  {loc.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Miles - Only show in manual mode */}
                    {!odometerMode && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Miles {isRoundTrip && <span className="text-muted-foreground">(one way - will be doubled)</span>}
                        </Label>
                        <NumberInput
                          placeholder="Distance"
                          value={miles}
                          onChange={(e) => setMiles(e.target.value)}
                          step="0.1"
                          min="0"
                        />
                        {isRoundTrip && miles && (
                          <p className="text-xs text-muted-foreground">
                            Total recorded: {(parseFloat(miles) * 2).toFixed(1)} miles
                          </p>
                        )}
                      </div>
                    )}

                    {/* Purpose */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Purpose</Label>
                      <Input
                        placeholder="e.g., Stock run, Service call"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                      />
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

                    <Button onClick={handleAddEntry} className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Log Trip
                    </Button>
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
                    {entries.slice(0, 5).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No trips logged yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {entries.slice(0, 5).map(entry => (
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
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{entry.miles.toFixed(1)} mi</Badge>
                              {entry.isRoundTrip && (
                                <Badge variant="outline" className="text-xs">RT</Badge>
                              )}
                            </div>
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
            </TabsContent>

            {/* Routes Tab */}
            <TabsContent value="routes">
              <RouteManager
                routes={routes}
                onAddRoute={addRoute}
                onUpdateRoute={updateRoute}
                onDeleteRoute={deleteRoute}
                onUseRoute={handleUseRoute}
              />
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
                      <SelectContent>
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
                            <TableHead>Date</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead className="text-right">Miles</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEntries.map(entry => (
                            <TableRow key={entry.id} className="hover:bg-muted/20">
                              <TableCell className="font-medium">
                                {format(entry.date, "MM/dd")}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                {entry.startLocation}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                {entry.endLocation}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {entry.miles.toFixed(1)}
                                  {entry.isRoundTrip && (
                                    <Badge variant="outline" className="text-xs">RT</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate text-muted-foreground">
                                {entry.purpose || "-"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive/70 hover:text-destructive"
                                  onClick={() => handleDeleteEntry(entry.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MileageTracker;
