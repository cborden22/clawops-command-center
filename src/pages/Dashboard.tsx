import { useLocations } from "@/hooks/useLocationsDB";
import { useRevenueEntries } from "@/hooks/useRevenueEntriesDB";
import { useInventory } from "@/hooks/useInventoryDB";
import { useRoutes } from "@/hooks/useRoutesDB";
import { useUserSchedules } from "@/hooks/useUserSchedules";
import { useSmartScheduler, ScheduledTask } from "@/hooks/useSmartScheduler";
import { useMaintenanceReports } from "@/hooks/useMaintenanceReports";
import { useLeadsDB } from "@/hooks/useLeadsDB";
import { useMyTeamPermissions } from "@/hooks/useMyTeamPermissions";
import { useCalendarTasks } from "@/hooks/useCalendarTasks";
import { LeadsWidget } from "@/components/dashboard/LeadsWidget";
import { BusinessHealthWidget } from "@/components/dashboard/BusinessHealthWidget";
import { BudgetTrackingWidget } from "@/components/dashboard/BudgetTrackingWidget";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ExternalLink,
   Settings
} from "lucide-react";
import { MaintenanceWidget } from "@/components/maintenance/MaintenanceWidget";
import { WeeklyCalendarWidget } from "@/components/dashboard/WeeklyCalendarWidget";
import { RestockDueWidget } from "@/components/dashboard/RestockDueWidget";
 import { DashboardCustomizer } from "@/components/dashboard/DashboardCustomizer";
import { Link } from "react-router-dom";
import { format, startOfMonth, endOfMonth, isWithinInterval, startOfDay, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useMobileRefresh } from "@/contexts/MobileRefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { WidgetSize } from "@/hooks/useUserPreferences";
import { useBusinessHealth } from "@/hooks/useBusinessHealth";
import { useExpenseBudgets } from "@/hooks/useExpenseBudgets";
import { useMachineCollections } from "@/hooks/useMachineCollections";

type WidgetId = 'primaryStats' | 'weeklyCalendar' | 'collectionDue' | 'allTimeSummary' | 'topLocations' | 'lowStockAlerts' | 'recentTransactions' | 'quickActions' | 'maintenance' | 'leads' | 'businessHealth' | 'budgetTracking';

interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
  size: WidgetSize;
}

const DEFAULT_WIDGET_ORDER: WidgetConfig[] = [
  { id: 'primaryStats', label: 'Primary Stats', visible: true, size: 'full' },
  { id: 'weeklyCalendar', label: 'Weekly Calendar', visible: true, size: 'full' },
  { id: 'businessHealth', label: 'Business Health', visible: true, size: 'md' },
  { id: 'budgetTracking', label: 'Expense Budgets', visible: true, size: 'md' },
  { id: 'collectionDue', label: 'Restock Reminders', visible: true, size: 'md' },
  { id: 'maintenance', label: 'Maintenance', visible: true, size: 'md' },
  { id: 'leads', label: 'Leads Pipeline', visible: true, size: 'md' },
  { id: 'allTimeSummary', label: 'All-Time Summary', visible: true, size: 'sm' },
  { id: 'topLocations', label: 'Top Locations', visible: true, size: 'sm' },
  { id: 'lowStockAlerts', label: 'Low Stock Alerts', visible: true, size: 'sm' },
  { id: 'recentTransactions', label: 'Recent Transactions', visible: true, size: 'md' },
  { id: 'quickActions', label: 'Quick Actions', visible: true, size: 'full' },
];

const SIZE_TO_COLS: Record<WidgetSize, string> = {
  sm: 'md:col-span-4',
  md: 'md:col-span-6',
  lg: 'md:col-span-8',
  full: 'md:col-span-12',
};

const DASHBOARD_LAYOUT_KEY = "clawops-dashboard-layout-v2";

export default function Dashboard() {
  const { locations, activeLocations, isLoaded: locationsLoaded, refetch: refetchLocations } = useLocations();
  const { entries, isLoaded: entriesLoaded, refetch: refetchEntries } = useRevenueEntries();
  const { items: inventoryItems, isLoaded: inventoryLoaded, refetch: refetchInventory } = useInventory();
  const { routes, isLoaded: routesLoaded, refetch: refetchRoutes } = useRoutes();
  const { schedules, isLoaded: schedulesLoaded, refetch: refetchSchedules } = useUserSchedules();
  const { reports: maintenanceReports, isLoaded: maintenanceLoaded } = useMaintenanceReports();
  const { leads } = useLeadsDB();
  const permissions = useMyTeamPermissions();
  const { collections } = useMachineCollections();
  const { budgets } = useExpenseBudgets();
  
  const businessHealth = useBusinessHealth({
    entries: entries.map(e => ({ id: e.id, type: e.type, locationId: e.locationId, date: e.date instanceof Date ? e.date : new Date(e.date), amount: e.amount })),
    locations: activeLocations,
    collections: collections.map(c => ({ id: c.id, locationId: c.locationId, machineId: c.machineId, collectionDate: c.collectionDate, coinsInserted: c.coinsInserted, prizesWon: c.prizesWon })),
  });
  const { tasks: calendarTasks, isLoaded: calendarTasksLoaded } = useCalendarTasks();
  
  // Smart scheduler for calendar and reminders - now includes leads
  const { 
    tasksByDate: schedulerTasksByDate, 
    overdueRestocks, 
    dueTodayRestocks 
  } = useSmartScheduler({
    locations,
    routes,
    userSchedules: schedules,
    maintenanceReports: maintenanceReports.map(r => ({
      id: r.id,
      status: r.status,
      machineId: r.machine_id,
      description: r.description,
    })),
    leads: leads.map(l => ({
      id: l.id,
      business_name: l.business_name,
      next_follow_up: l.next_follow_up,
      status: l.status,
      priority: l.priority,
    })),
  });

  // Merge custom calendar tasks into tasksByDate
  const tasksByDate = useMemo(() => {
    const merged = new Map<string, ScheduledTask[]>();
    // Copy scheduler tasks
    schedulerTasksByDate.forEach((tasks, dateKey) => {
      merged.set(dateKey, [...tasks]);
    });
    // Add custom calendar tasks for the current week
    const today = startOfDay(new Date());
    const weekEnd = addDays(today, 6);
    calendarTasks
      .filter(ct => !ct.completed)
      .forEach(ct => {
        const taskDate = new Date(ct.taskDate);
        if (taskDate >= today && taskDate <= weekEnd) {
          const dateKey = ct.taskDate;
          const scheduled: ScheduledTask = {
            id: `custom-${ct.id}`,
            type: "custom",
            title: ct.title,
            subtitle: ct.description || undefined,
            dueDate: taskDate,
            status: "upcoming",
            priority: "medium",
            link: "/calendar",
            metadata: { isCustom: true },
          };
          const existing = merged.get(dateKey) || [];
          existing.push(scheduled);
          merged.set(dateKey, existing);
        }
      });
    return merged;
  }, [schedulerTasksByDate, calendarTasks]);

  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGET_ORDER);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
   const [customizePanelOpen, setCustomizePanelOpen] = useState(false);
  
  const isMobile = useIsMobile();
  const { registerRefresh, unregisterRefresh } = useMobileRefresh();
  
  // Filter widgets based on permissions
  const filteredWidgets = useMemo(() => {
    return widgets.filter(widget => {
      if (permissions.isLoading) return true;
      if (permissions.isOwner) return true;
      
      // Permission-based filtering
      if (widget.id === 'leads') return permissions.canViewLeads;
      if (widget.id === 'maintenance') return permissions.canViewMaintenance;
      if (widget.id === 'collectionDue') return permissions.canViewLocations;
      if (widget.id === 'recentTransactions') return permissions.canViewRevenue;
      if (widget.id === 'allTimeSummary') return permissions.canViewRevenue;
      if (widget.id === 'topLocations') return permissions.canViewLocations && permissions.canViewRevenue;
      if (widget.id === 'lowStockAlerts') return permissions.canViewInventory;
      
      return true;
    });
  }, [widgets, permissions]);

  // Register mobile refresh callback
  useEffect(() => {
    if (isMobile) {
      const refreshAll = async () => {
        await Promise.all([
          refetchLocations(),
          refetchEntries(),
          refetchInventory(),
        ]);
      };
      registerRefresh("dashboard", refreshAll);
      return () => unregisterRefresh("dashboard");
    }
  }, [isMobile, registerRefresh, unregisterRefresh, refetchLocations, refetchEntries, refetchInventory]);

  // Load layout
  useEffect(() => {
    const saved = localStorage.getItem(DASHBOARD_LAYOUT_KEY);
    if (saved) {
      try {
        const savedWidgets = JSON.parse(saved);
        // Merge with defaults to handle new widgets
        const mergedWidgets = DEFAULT_WIDGET_ORDER.map(defaultWidget => {
          const savedWidget = savedWidgets.find((w: WidgetConfig) => w.id === defaultWidget.id);
          if (savedWidget) {
            return {
              ...defaultWidget,
              visible: savedWidget.visible,
              size: savedWidget.size || defaultWidget.size,
            };
          }
          return defaultWidget;
        });
        // Preserve order from saved
        const orderedWidgets = savedWidgets
          .filter((w: WidgetConfig) => DEFAULT_WIDGET_ORDER.some(d => d.id === w.id))
          .map((w: WidgetConfig) => mergedWidgets.find(m => m.id === w.id)!);
        // Add any new widgets at the end
        DEFAULT_WIDGET_ORDER.forEach(d => {
          if (!orderedWidgets.find((o: WidgetConfig) => o.id === d.id)) {
            orderedWidgets.push(mergedWidgets.find(m => m.id === d.id)!);
          }
        });
        setWidgets(orderedWidgets);
      } catch (e) {
        console.error("Failed to load dashboard layout:", e);
      }
    }
    setLayoutLoaded(true);
  }, []);

  // Save layout
  useEffect(() => {
    if (layoutLoaded) {
      localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(widgets));
    }
  }, [widgets, layoutLoaded]);

  const resetLayout = () => {
    setWidgets(DEFAULT_WIDGET_ORDER);
  };

  const isLoaded = locationsLoaded && entriesLoaded && inventoryLoaded && layoutLoaded && routesLoaded && schedulesLoaded && maintenanceLoaded;

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

  // Widget render functions
  const renderPrimaryStats = () => {
    const showLocations = permissions.isOwner || permissions.canViewLocations;
    const showRevenue = permissions.isOwner || permissions.canViewRevenue;
    const showInventory = permissions.isOwner || permissions.canViewInventory;
    
    const cards = [];
    
    if (showLocations) {
      cards.push(
        <Card key="locations" className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-4 sm:pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-3 sm:gap-4 relative">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Locations</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{activeLocations.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{totalMachines} machines</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (showRevenue) {
      cards.push(
        <Card key="income" className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-4 sm:pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-3 sm:gap-4 relative">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Month Income</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">${totalIncome.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{format(now, "MMMM")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
      cards.push(
        <Card key="profit" className={cn(
          "glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden",
          netProfit < 0 && "border-destructive/30"
        )}>
          <CardContent className="pt-4 sm:pt-6 relative">
            <div className={cn(
              "absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500",
              netProfit >= 0 ? "bg-primary/10" : "bg-destructive/10"
            )} />
            <div className="flex items-center gap-3 sm:gap-4 relative">
              <div className={cn(
                "p-2 sm:p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300",
                netProfit >= 0 
                  ? "bg-gradient-to-br from-primary to-primary/80" 
                  : "bg-gradient-to-br from-destructive to-destructive/80"
              )}>
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className={cn(
                  "text-2xl sm:text-3xl font-bold tracking-tight",
                  netProfit >= 0 ? "text-foreground" : "text-destructive"
                )}>
                  ${Math.abs(netProfit).toLocaleString()}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {netProfit >= 0 ? "Profit" : "Loss"} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (showInventory) {
      cards.push(
        <Card key="inventory" className={cn(
          "glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden",
          lowStockItems.length > 0 && "border-amber-500/30 bg-amber-500/5"
        )}>
          <CardContent className="pt-4 sm:pt-6 relative">
            <div className={cn(
              "absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500",
              lowStockItems.length > 0 ? "bg-amber-500/10" : "bg-accent/50"
            )} />
            <div className="flex items-center gap-3 sm:gap-4 relative">
              <div className={cn(
                "p-2 sm:p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300",
                lowStockItems.length > 0 
                  ? "bg-gradient-to-br from-amber-500 to-amber-600" 
                  : "bg-gradient-to-br from-muted-foreground/80 to-muted-foreground/60"
              )}>
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Inventory</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{totalInventoryItems}</p>
                {lowStockItems.length > 0 ? (
                  <p className="text-[10px] sm:text-xs text-amber-600 font-medium">{lowStockItems.length} low stock</p>
                ) : (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">All stocked</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (cards.length === 0) return null;
    
    return (
      <div className={cn(
        "grid gap-3 sm:gap-4",
        cards.length === 1 && "grid-cols-1",
        cards.length === 2 && "grid-cols-2",
        cards.length === 3 && "grid-cols-2 lg:grid-cols-3",
        cards.length >= 4 && "grid-cols-2 lg:grid-cols-4",
      )}>
        {cards}
      </div>
    );
  };

  const renderAllTimeSummary = () => (
    <Card className="glass-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          All-Time Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
  );

  const renderTopLocations = () => (
    <Card className="glass-card h-full">
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
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">{loc.address}</p>
                </div>
              </div>
              <span className="font-bold text-green-600">${loc.totalIncome.toLocaleString()}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  const renderLowStockAlerts = () => (
    <Card className={cn(
      "glass-card h-full",
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
          lowStockItems.slice(0, 4).map(item => {
            const restockNeeded = item.minStock - item.quantity;
            const restockCost = restockNeeded > 0 && item.pricePerItem 
              ? restockNeeded * item.pricePerItem 
              : null;
            
            return (
              <div 
                key={item.id} 
                className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} remaining (threshold: {item.minStock})
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {item.quantity} left
                  </Badge>
                </div>
                {(restockCost || item.supplierUrl) && (
                  <div className="flex items-center justify-between text-xs">
                    {restockCost ? (
                      <span className="text-muted-foreground">
                        Est. restock: {restockNeeded} × ${item.pricePerItem?.toFixed(2)} = 
                        <span className="font-medium text-foreground ml-1">${restockCost.toFixed(2)}</span>
                      </span>
                    ) : (
                      <span />
                    )}
                    {item.supplierUrl && (
                      <a 
                        href={item.supplierUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {item.supplierName || "View Supplier"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        {lowStockItems.length > 4 && (
          <p className="text-xs text-center text-muted-foreground">
            +{lowStockItems.length - 4} more items
          </p>
        )}
      </CardContent>
    </Card>
  );

  const renderRecentTransactions = () => (
    <Card className="glass-card h-full">
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
  );

  const renderQuickActions = () => {
    const actions = [];
    
    if (permissions.isOwner || permissions.canViewLocations) {
      actions.push(
        <Link key="locations" to="/locations">
          <Card className="glass-card hover:shadow-hover transition-all duration-300 cursor-pointer group">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-sm">Add Location</span>
            </CardContent>
          </Card>
        </Link>
      );
    }
    
    if (permissions.isOwner || permissions.canViewRevenue) {
      actions.push(
        <Link key="revenue" to="/revenue">
          <Card className="glass-card hover:shadow-hover transition-all duration-300 cursor-pointer group">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium text-sm">Log Revenue</span>
            </CardContent>
          </Card>
        </Link>
      );
    }
    
    if (permissions.isOwner || permissions.canViewDocuments) {
      actions.push(
        <Link key="commission" to="/commission-summary">
          <Card className="glass-card hover:shadow-hover transition-all duration-300 cursor-pointer group">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
              <span className="font-medium text-sm">Commission</span>
            </CardContent>
          </Card>
        </Link>
      );
    }
    
    if (permissions.isOwner || permissions.canViewInventory) {
      actions.push(
        <Link key="inventory" to="/inventory">
          <Card className="glass-card hover:shadow-hover transition-all duration-300 cursor-pointer group">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium text-sm">Inventory</span>
            </CardContent>
          </Card>
        </Link>
      );
    }
    
    if (actions.length === 0) return null;
    
    return (
      <div className={cn(
        "grid gap-3 sm:gap-4",
        actions.length <= 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
      )}>
        {actions}
      </div>
    );
  };

  const renderMaintenance = () => <MaintenanceWidget />;

  const renderLeads = () => <LeadsWidget />;

  const renderWeeklyCalendar = () => <WeeklyCalendarWidget tasksByDate={tasksByDate} />;

  const renderCollectionDue = () => (
    <RestockDueWidget 
      overdueRestocks={overdueRestocks} 
      dueTodayRestocks={dueTodayRestocks} 
    />
  );

  const renderBusinessHealth = () => (
    <BusinessHealthWidget
      revenuePerMachineThisWeek={businessHealth.revenuePerMachineThisWeek}
      weekOverWeekChange={businessHealth.weekOverWeekChange}
      collectionStreak={businessHealth.collectionStreak}
      overallGrowth={businessHealth.overallGrowth}
      totalThisMonth={businessHealth.totalThisMonth}
      underperformers={businessHealth.underperformers}
      locationGrowth={businessHealth.locationGrowth}
    />
  );

  const renderBudgetTracking = () => (
    <BudgetTrackingWidget
      budgets={budgets}
      expenses={entries.map(e => ({ category: e.category, amount: e.amount, date: e.date instanceof Date ? e.date : new Date(e.date), type: e.type }))}
    />
  );

  const widgetRenderers: Record<WidgetId, () => JSX.Element> = {
    primaryStats: renderPrimaryStats,
    weeklyCalendar: renderWeeklyCalendar,
    businessHealth: renderBusinessHealth,
    budgetTracking: renderBudgetTracking,
    collectionDue: renderCollectionDue,
    maintenance: renderMaintenance,
    leads: renderLeads,
    allTimeSummary: renderAllTimeSummary,
    topLocations: renderTopLocations,
    lowStockAlerts: renderLowStockAlerts,
    recentTransactions: renderRecentTransactions,
    quickActions: renderQuickActions,
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back! Here's your business overview for {format(now, "MMMM yyyy")}.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2 shrink-0"
               onClick={() => setCustomizePanelOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
              Customize
            </Button>
        </div>
      </div>

       {/* Dashboard Customizer Panel */}
       <DashboardCustomizer
         open={customizePanelOpen}
         onOpenChange={setCustomizePanelOpen}
         widgets={widgets}
         onWidgetsChange={setWidgets}
         onReset={resetLayout}
       />

      {/* Widgets Grid */}
      <div className="grid grid-cols-12 gap-4">
        {filteredWidgets.map((widget) => {
           if (!widget.visible) return null;
          
          return (
            <div
              key={widget.id}
              className={cn(
                "col-span-12",
                SIZE_TO_COLS[widget.size],
                 "transition-all duration-200"
              )}
            >
               {widgetRenderers[widget.id]()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
