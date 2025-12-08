import { useLocations } from "@/hooks/useLocations";
import { useRevenueEntries } from "@/hooks/useRevenueEntries";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  ArrowRight,
  Activity,
  BarChart3,
  Wallet,
  Settings2,
  RotateCcw
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  location: string;
  lastUpdated: string;
}

interface DashboardPreferences {
  showPrimaryStats: boolean;
  showAllTimeSummary: boolean;
  showTopLocations: boolean;
  showLowStockAlerts: boolean;
  showRecentTransactions: boolean;
  showQuickActions: boolean;
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  showPrimaryStats: true,
  showAllTimeSummary: true,
  showTopLocations: true,
  showLowStockAlerts: true,
  showRecentTransactions: true,
  showQuickActions: true,
};

const INVENTORY_STORAGE_KEY = "clawops-inventory";
const DASHBOARD_PREFS_KEY = "clawops-dashboard-prefs";

export default function Dashboard() {
  const { locations, activeLocations, isLoaded: locationsLoaded } = useLocations();
  const { entries, isLoaded: entriesLoaded } = useRevenueEntries();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load inventory
  useEffect(() => {
    const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (saved) {
      try {
        setInventoryItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load inventory:", e);
      }
    }
    setInventoryLoaded(true);
  }, []);

  // Load preferences
  useEffect(() => {
    const saved = localStorage.getItem(DASHBOARD_PREFS_KEY);
    if (saved) {
      try {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to load dashboard preferences:", e);
      }
    }
    setPrefsLoaded(true);
  }, []);

  // Save preferences
  useEffect(() => {
    if (prefsLoaded) {
      localStorage.setItem(DASHBOARD_PREFS_KEY, JSON.stringify(preferences));
    }
  }, [preferences, prefsLoaded]);

  const updatePreference = (key: keyof DashboardPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  const isLoaded = locationsLoaded && entriesLoaded && inventoryLoaded;

  // Calculate this month's revenue data
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const thisMonthEntries = entries.filter(entry => 
    isWithinInterval(new Date(entry.date), { start: monthStart, end: monthEnd })
  );

  const totalIncome = thisMonthEntries
    .filter(e => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = thisMonthEntries
    .filter(e => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  // All-time totals
  const allTimeIncome = entries
    .filter(e => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);

  const allTimeExpenses = entries
    .filter(e => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  // Inventory stats
  const totalInventoryItems = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = inventoryItems.filter(item => item.quantity <= item.minStock);

  // Machine count across all active locations
  const totalMachines = activeLocations.reduce((sum, loc) => {
    return sum + (loc.machines?.reduce((mSum, m) => mSum + m.count, 0) || 0);
  }, 0);

  // Recent entries
  const recentEntries = entries.slice(0, 5);

  // Top performing locations (by income)
  const locationIncomes = activeLocations.map(loc => {
    const income = entries
      .filter(e => e.type === "income" && e.locationId === loc.id)
      .reduce((sum, e) => sum + e.amount, 0);
    return { ...loc, totalIncome: income };
  }).sort((a, b) => b.totalIncome - a.totalIncome).slice(0, 3);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your business overview for {format(now, "MMMM yyyy")}.
          </p>
        </div>
        
        {/* Customize Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 shrink-0">
              <Settings2 className="h-4 w-4" />
              Customize
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-background border-border">
            <SheetHeader>
              <SheetTitle>Customize Dashboard</SheetTitle>
              <SheetDescription>
                Choose which widgets to display on your dashboard.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="primaryStats" className="flex flex-col gap-1">
                    <span className="font-medium">Primary Stats</span>
                    <span className="text-xs text-muted-foreground">Locations, Income, Profit, Inventory</span>
                  </Label>
                  <Switch 
                    id="primaryStats"
                    checked={preferences.showPrimaryStats}
                    onCheckedChange={(checked) => updatePreference('showPrimaryStats', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="allTimeSummary" className="flex flex-col gap-1">
                    <span className="font-medium">All-Time Summary</span>
                    <span className="text-xs text-muted-foreground">Total revenue, expenses, profit</span>
                  </Label>
                  <Switch 
                    id="allTimeSummary"
                    checked={preferences.showAllTimeSummary}
                    onCheckedChange={(checked) => updatePreference('showAllTimeSummary', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="topLocations" className="flex flex-col gap-1">
                    <span className="font-medium">Top Locations</span>
                    <span className="text-xs text-muted-foreground">Best performing locations</span>
                  </Label>
                  <Switch 
                    id="topLocations"
                    checked={preferences.showTopLocations}
                    onCheckedChange={(checked) => updatePreference('showTopLocations', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="lowStockAlerts" className="flex flex-col gap-1">
                    <span className="font-medium">Low Stock Alerts</span>
                    <span className="text-xs text-muted-foreground">Inventory warnings</span>
                  </Label>
                  <Switch 
                    id="lowStockAlerts"
                    checked={preferences.showLowStockAlerts}
                    onCheckedChange={(checked) => updatePreference('showLowStockAlerts', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="recentTransactions" className="flex flex-col gap-1">
                    <span className="font-medium">Recent Transactions</span>
                    <span className="text-xs text-muted-foreground">Latest income and expenses</span>
                  </Label>
                  <Switch 
                    id="recentTransactions"
                    checked={preferences.showRecentTransactions}
                    onCheckedChange={(checked) => updatePreference('showRecentTransactions', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="quickActions" className="flex flex-col gap-1">
                    <span className="font-medium">Quick Actions</span>
                    <span className="text-xs text-muted-foreground">Shortcut buttons</span>
                  </Label>
                  <Switch 
                    id="quickActions"
                    checked={preferences.showQuickActions}
                    onCheckedChange={(checked) => updatePreference('showQuickActions', checked)}
                  />
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full gap-2" 
                onClick={resetPreferences}
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Primary Stats Row */}
      {preferences.showPrimaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Locations */}
          <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
            <CardContent className="pt-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center gap-4 relative">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Locations</p>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{activeLocations.length}</p>
                  <p className="text-xs text-muted-foreground">{totalMachines} machines total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month Revenue */}
          <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
            <CardContent className="pt-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center gap-4 relative">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Month Income</p>
                  <p className="text-3xl font-bold text-foreground tracking-tight">${totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{format(now, "MMMM")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className={cn(
            "glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden",
            netProfit < 0 && "border-destructive/30"
          )}>
            <CardContent className="pt-6 relative">
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500",
                netProfit >= 0 ? "bg-primary/10" : "bg-destructive/10"
              )} />
              <div className="flex items-center gap-4 relative">
                <div className={cn(
                  "p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300",
                  netProfit >= 0 
                    ? "bg-gradient-to-br from-primary to-primary/80" 
                    : "bg-gradient-to-br from-destructive to-destructive/80"
                )}>
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                  <p className={cn(
                    "text-3xl font-bold tracking-tight",
                    netProfit >= 0 ? "text-foreground" : "text-destructive"
                  )}>
                    ${Math.abs(netProfit).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {netProfit >= 0 ? "Profit" : "Loss"} this month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Status */}
          <Card className={cn(
            "glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden",
            lowStockItems.length > 0 && "border-amber-500/30 bg-amber-500/5"
          )}>
            <CardContent className="pt-6 relative">
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500",
                lowStockItems.length > 0 ? "bg-amber-500/10" : "bg-accent/50"
              )} />
              <div className="flex items-center gap-4 relative">
                <div className={cn(
                  "p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300",
                  lowStockItems.length > 0 
                    ? "bg-gradient-to-br from-amber-500 to-amber-600" 
                    : "bg-gradient-to-br from-muted-foreground/80 to-muted-foreground/60"
                )}>
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inventory</p>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{totalInventoryItems}</p>
                  {lowStockItems.length > 0 ? (
                    <p className="text-xs text-amber-600 font-medium">{lowStockItems.length} low stock alerts</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">All stocked up</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Secondary Stats & Quick Actions */}
      {(preferences.showAllTimeSummary || preferences.showTopLocations || preferences.showLowStockAlerts) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* All-Time Summary */}
          {preferences.showAllTimeSummary && (
            <Card className="glass-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  All-Time Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Total Revenue</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">${allTimeIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-medium">Total Expenses</span>
                  </div>
                  <span className="text-lg font-bold text-destructive">${allTimeExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">All-Time Profit</span>
                  </div>
                  <span className={cn(
                    "text-lg font-bold",
                    (allTimeIncome - allTimeExpenses) >= 0 ? "text-primary" : "text-destructive"
                  )}>
                    ${(allTimeIncome - allTimeExpenses).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Performing Locations */}
          {preferences.showTopLocations && (
            <Card className="glass-card lg:col-span-1">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Top Locations
                </CardTitle>
                <Link to="/locations">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {locationIncomes.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No location data yet
                  </div>
                ) : (
                  locationIncomes.map((loc, index) => (
                    <div 
                      key={loc.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                          index === 0 && "bg-amber-500/20 text-amber-600",
                          index === 1 && "bg-slate-400/20 text-slate-600",
                          index === 2 && "bg-orange-500/20 text-orange-600"
                        )}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{loc.name}</p>
                          <p className="text-xs text-muted-foreground">{loc.address}</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600">${loc.totalIncome.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Low Stock Alerts */}
          {preferences.showLowStockAlerts && (
            <Card className={cn(
              "glass-card lg:col-span-1",
              lowStockItems.length > 0 && "border-amber-500/30"
            )}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className={cn(
                    "h-5 w-5",
                    lowStockItems.length > 0 ? "text-amber-500" : "text-muted-foreground"
                  )} />
                  Low Stock Alerts
                </CardTitle>
                <Link to="/inventory">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Manage <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-6 text-green-600 text-sm font-medium">
                    ✓ All inventory items are well-stocked
                  </div>
                ) : (
                  lowStockItems.slice(0, 4).map(item => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {item.quantity} left
                      </Badge>
                    </div>
                  ))
                )}
                {lowStockItems.length > 4 && (
                  <p className="text-xs text-center text-muted-foreground">
                    +{lowStockItems.length - 4} more items
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity */}
      {preferences.showRecentTransactions && (
        <Card className="glass-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Recent Transactions
            </CardTitle>
            <Link to="/revenue">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No transactions yet</p>
                <Link to="/revenue">
                  <Button variant="link" className="mt-2">
                    Log your first entry
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentEntries.map(entry => {
                  const location = locations.find(l => l.id === entry.locationId);
                  return (
                    <div 
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          entry.type === "income" 
                            ? "bg-green-500/10 text-green-600" 
                            : "bg-destructive/10 text-destructive"
                        )}>
                          {entry.type === "income" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {location?.name || "Unknown Location"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.notes || entry.category || entry.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          entry.type === "income" ? "text-green-600" : "text-destructive"
                        )}>
                          {entry.type === "income" ? "+" : "-"}${entry.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.date), "MMM d")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {preferences.showQuickActions && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/locations">
            <Card className="glass-card hover:shadow-hover transition-all duration-300 cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-sm">Add Location</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/revenue">
            <Card className="glass-card hover:shadow-hover transition-all duration-300 cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-medium text-sm">Log Revenue</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/commission-summary">
            <Card className="glass-card hover:shadow-hover transition-all duration-300 cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                </div>
                <span className="font-medium text-sm">Commission</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/inventory">
            <Card className="glass-card hover:shadow-hover transition-all duration-300 cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-medium text-sm">Inventory</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
