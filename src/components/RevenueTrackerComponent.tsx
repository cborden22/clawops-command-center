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
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, MapPin, Building2 } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

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
  
  // Entry form state
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [collectionDate, setCollectionDate] = useState<Date>(new Date());
  const [grossRevenue, setGrossRevenue] = useState("");
  const [notes, setNotes] = useState("");
  
  // Filter state
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
  };

  const deleteLocation = (id: string) => {
    setLocations(locations.filter(l => l.id !== id));
    setEntries(entries.filter(e => e.locationId !== id));
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
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const getFilteredEntries = () => {
    let filtered = [...entries];
    
    // Filter by location
    if (filterLocation !== "all") {
      filtered = filtered.filter(e => e.locationId === filterLocation);
    }
    
    // Filter by period
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

  // Chart data - aggregate by date
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

  // Location performance data
  const locationPerformance = locations.map(loc => {
    const locEntries = filteredEntries.filter(e => e.locationId === loc.id);
    const total = locEntries.reduce((sum, e) => sum + e.grossRevenue, 0);
    return { name: loc.name, revenue: total, collections: locEntries.length };
  }).sort((a, b) => b.revenue - a.revenue);

  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || "Unknown";

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-muted">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg per Collection</p>
                <p className="text-2xl font-bold text-foreground">${avgPerCollection.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-muted">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Locations</p>
                <p className="text-2xl font-bold text-foreground">{locations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Entry Form & Locations */}
        <div className="space-y-6">
          {/* Add Collection Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Log Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Collection Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
                <Label>Gross Revenue ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={grossRevenue}
                  onChange={(e) => setGrossRevenue(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Refilled prizes"
                />
              </div>
              
              <Button 
                onClick={addEntry} 
                className="w-full"
                disabled={!selectedLocation || !grossRevenue}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Collection
              </Button>
            </CardContent>
          </Card>

          {/* Manage Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddLocation ? (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <Input
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="Location name"
                  />
                  <Input
                    value={newLocationAddress}
                    onChange={(e) => setNewLocationAddress(e.target.value)}
                    placeholder="Address (optional)"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addLocation}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddLocation(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowAddLocation(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              )}
              
              <div className="space-y-2">
                {locations.map(loc => (
                  <div key={loc.id} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                    <div>
                      <p className="font-medium text-sm">{loc.name}</p>
                      {loc.address && <p className="text-xs text-muted-foreground">{loc.address}</p>}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteLocation(loc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {locations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">Time Period</Label>
                  <Select value={filterPeriod} onValueChange={(v: any) => setFilterPeriod(v)}>
                    <SelectTrigger>
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
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Performance */}
          {locationPerformance.length > 0 && locationPerformance.some(l => l.revenue > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Location Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationPerformance.filter(l => l.revenue > 0)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
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
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Collection History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Collection History</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.slice(0, 20).map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {format(entry.date, "MM/dd/yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getLocationName(entry.locationId)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            ${entry.grossRevenue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {entry.notes || "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
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
                    <p className="text-sm text-muted-foreground text-center mt-4">
                      Showing 20 of {filteredEntries.length} entries
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No collections recorded yet</p>
                  <p className="text-sm text-muted-foreground">Add a location and log your first collection</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
