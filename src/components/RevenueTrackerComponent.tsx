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
import { CalendarIcon, Plus, Trash2, TrendingUp, DollarSign, MapPin, Sparkles, AlertCircle } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { toast } from "@/hooks/use-toast";
import { useLocations } from "@/hooks/useLocations";
import { Link } from "react-router-dom";

interface RevenueEntry {
  id: string;
  locationId: string;
  date: Date;
  grossRevenue: number;
  notes: string;
}

const ENTRIES_STORAGE_KEY = "clawops-revenue-entries";

export function RevenueTrackerComponent() {
  const { activeLocations, getLocationById, isLoaded } = useLocations();
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [collectionDate, setCollectionDate] = useState<Date>(new Date());
  const [grossRevenue, setGrossRevenue] = useState("");
  const [notes, setNotes] = useState("");
  
  const [filterPeriod, setFilterPeriod] = useState<"7days" | "30days" | "thisMonth" | "all">("30days");
  const [filterLocation, setFilterLocation] = useState<string>("all");

  useEffect(() => {
    const saved = localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setEntries((data || []).map((e: any) => ({ ...e, date: new Date(e.date) })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

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
    const loc = getLocationById(selectedLocation);
    toast({ 
      title: "Collection Logged", 
      description: `$${parseFloat(grossRevenue).toFixed(2)} recorded for ${loc?.name || "location"}` 
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

  const locationPerformance = activeLocations.map(loc => {
    const locEntries = filteredEntries.filter(e => e.locationId === loc.id);
    const total = locEntries.reduce((sum, e) => sum + e.grossRevenue, 0);
    return { name: loc.name, revenue: total, collections: locEntries.length };
  }).sort((a, b) => b.revenue - a.revenue);

  const getLocationName = (id: string) => getLocationById(id)?.name || "Unknown";

  if (!isLoaded) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

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
                <p className="text-3xl font-bold text-foreground tracking-tight">{activeLocations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Entry Form */}
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
              {activeLocations.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">No locations yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Add locations in the Location Tracker first</p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/locations">Go to Locations</Link>
                  </Button>
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
                        {activeLocations.map(loc => (
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
                      {activeLocations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          {chartData.length > 0 && (
            <Card className="glass-card overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
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
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
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
              <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-muted">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  Location Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationPerformance.filter(l => l.revenue > 0)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
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
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                Collection History
                <Badge variant="secondary" className="ml-auto">{filteredEntries.length} entries</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">No collections recorded yet</p>
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="text-right font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Notes</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.slice(0, 10).map((entry) => (
                        <TableRow key={entry.id} className="group">
                          <TableCell className="text-muted-foreground">{format(entry.date, "MMM d, yyyy")}</TableCell>
                          <TableCell className="font-medium">{getLocationName(entry.locationId)}</TableCell>
                          <TableCell className="text-right font-bold text-primary">${entry.grossRevenue.toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">{entry.notes || "—"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
