import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Trash2, TrendingUp, DollarSign, MapPin, Building2, Sparkles, ChevronRight } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { toast } from "@/hooks/use-toast";

interface Location {
  id: string;
  name: string;
  address: string;
}

interface RevenueEntry {
  id: string;
  locationId: string;
  date: Date;
  grossRevenue: number;
  notes: string;
}

const STORAGE_KEY = "clawops-revenue-data";

export function RevenueTrackerComponent() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");
  
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [collectionDate, setCollectionDate] = useState<Date>(new Date());
  const [grossRevenue, setGrossRevenue] = useState("");
  const [notes, setNotes] = useState("");
  
  const [filterPeriod, setFilterPeriod] = useState<"7days" | "30days" | "thisMonth" | "all">("30days");
  const [filterLocation, setFilterLocation] = useState<string>("all");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setLocations(data.locations || []);
      setEntries((data.entries || []).map((e: any) => ({ ...e, date: new Date(e.date) })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ locations, entries }));
  }, [locations, entries]);

  const addLocation = () => {
    if (!newLocationName.trim()) return;
    const newLoc: Location = {
      id: crypto.randomUUID(),
      name: newLocationName.trim(),
      address: newLocationAddress.trim(),
    };
    setLocations([...locations, newLoc]);
    setNewLocationName("");
    setNewLocationAddress("");
    setShowAddLocation(false);
    toast({ title: "Location Added", description: `${newLoc.name} has been added.` });
  };

  const deleteLocation = (id: string) => {
    const loc = locations.find(l => l.id === id);
    setLocations(locations.filter(l => l.id !== id));
    setEntries(entries.filter(e => e.locationId !== id));
    toast({ title: "Location Removed", description: `${loc?.name || "Location"} has been removed.` });
  };

  const addEntry = () => {
    if (!selectedLocation || !grossRevenue) return;
    const newEntry: RevenueEntry = {
      id: crypto.randomUUID(),
      locationId: selectedLocation,
      date: collectionDate,
      grossRevenue: parseFloat(grossRevenue),
      notes: notes.trim(),
    };
    setEntries([newEntry, ...entries]);
    setGrossRevenue("");
    setNotes("");
    toast({ 
      title: "Collection Logged", 
      description: `$${parseFloat(grossRevenue).toFixed(2)} recorded for ${getLocationName(selectedLocation)}` 
    });
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    toast({ title: "Entry Removed" });
  };

  const getFilteredEntries = () => {
    let filtered = [...entries];
    
    if (filterLocation !== "all") {
      filtered = filtered.filter(e => e.locationId === filterLocation);
    }
    
    const now = new Date();
    if (filterPeriod === "7days") {
      const start = subDays(now, 7);
      filtered = filtered.filter(e => e.date >= start);
    } else if (filterPeriod === "30days") {
      const start = subDays(now, 30);
      filtered = filtered.filter(e => e.date >= start);
    } else if (filterPeriod === "thisMonth") {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      filtered = filtered.filter(e => isWithinInterval(e.date, { start, end }));
    }
    
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const filteredEntries = getFilteredEntries();
  const totalRevenue = filteredEntries.reduce((sum, e) => sum + e.grossRevenue, 0);
  const avgPerCollection = filteredEntries.length > 0 ? totalRevenue / filteredEntries.length : 0;

  const chartData = filteredEntries
    .reduce((acc: { date: string; revenue: number }[], entry) => {
      const dateStr = format(entry.date, "MM/dd");
      const existing = acc.find(d => d.date === dateStr);
      if (existing) {
        existing.revenue += entry.grossRevenue;
      } else {
        acc.push({ date: dateStr, revenue: entry.grossRevenue });
      }
      return acc;
    }, [])
    .reverse()
    .slice(-14);

  const locationPerformance = locations.map(loc => {
    const locEntries = filteredEntries.filter(e => e.locationId === loc.id);
    const total = locEntries.reduce((sum, e) => sum + e.grossRevenue, 0);
    return { name: loc.name, revenue: total, collections: locEntries.length };
  }).sort((a, b) => b.revenue - a.revenue);

  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || "Unknown";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-muted to-muted/80 shadow-md group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg per Collection</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">${avgPerCollection.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-muted to-muted/80 shadow-md group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Locations</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">{locations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Entry Form & Locations */}
        <div className="space-y-6">
          {/* Add Collection Entry */}
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                Log Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {locations.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20">
                  <MapPin className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">No locations yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Add a location below to start logging</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Location</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger className="h-11 bg-background/50 hover:bg-background transition-colors">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            <span className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {loc.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Collection Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal h-11 bg-background/50 hover:bg-background">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {format(collectionDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={collectionDate}
                          onSelect={(date) => date && setCollectionDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Gross Revenue</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={grossRevenue}
                        onChange={(e) => setGrossRevenue(e.target.value)}
                        placeholder="0.00"
                        className="pl-9 h-11 bg-background/50 hover:bg-background transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Notes (optional)</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Refilled prizes"
                      className="h-11 bg-background/50 hover:bg-background transition-colors"
                    />
                  </div>
                  
                  <Button 
                    onClick={addEntry} 
                    className="w-full h-11 premium-button"
                    disabled={!selectedLocation || !grossRevenue}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Collection
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Manage Locations */}
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {showAddLocation ? (
                <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50 animate-scale-in">
                  <Input
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="Location name"
                    className="h-10 bg-background"
                  />
                  <Input
                    value={newLocationAddress}
                    onChange={(e) => setNewLocationAddress(e.target.value)}
                    placeholder="Address (optional)"
                    className="h-10 bg-background"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addLocation} className="flex-1">
                      <Plus className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddLocation(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full h-11 border-dashed hover:border-primary hover:bg-primary/5 transition-all" onClick={() => setShowAddLocation(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              )}
              
              <div className="space-y-2">
                {locations.map((loc, idx) => (
                  <div 
                    key={loc.id} 
                    className="flex items-center justify-between p-3 rounded-xl border bg-background/50 hover:bg-background hover:shadow-md transition-all duration-200 group"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{loc.name}</p>
                        {loc.address && <p className="text-xs text-muted-foreground">{loc.address}</p>}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                      onClick={() => deleteLocation(loc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {locations.length === 0 && !showAddLocation && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Add your first location to start tracking
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Charts & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Time Period</Label>
                  <Select value={filterPeriod} onValueChange={(v: any) => setFilterPeriod(v)}>
                    <SelectTrigger className="h-10 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Location</Label>
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="h-10 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trend Chart */}
          {chartData.length > 1 && (
            <Card className="glass-card overflow-hidden">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-card)'
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Performance */}
          {locationPerformance.length > 0 && locationPerformance.some(l => l.revenue > 0) && (
            <Card className="glass-card overflow-hidden">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Location Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationPerformance.filter(l => l.revenue > 0)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-card)'
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Collection History */}
          <Card className="glass-card overflow-hidden">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Collection History
                {filteredEntries.length > 0 && (
                  <Badge variant="secondary" className="ml-auto font-normal">
                    {filteredEntries.length} entries
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="text-right font-semibold">Revenue</TableHead>
                        <TableHead className="font-semibold">Notes</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.slice(0, 20).map((entry, idx) => (
                        <TableRow 
                          key={entry.id} 
                          className="group hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {format(entry.date, "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal bg-background">
                              <MapPin className="h-3 w-3 mr-1" />
                              {getLocationName(entry.locationId)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-bold text-primary text-lg">
                              ${entry.grossRevenue.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                            {entry.notes || "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                              onClick={() => deleteEntry(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredEntries.length > 20 && (
                    <div className="p-4 text-center border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing 20 of {filteredEntries.length} entries
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium text-muted-foreground">No collections recorded yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Add a location and log your first collection</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
