import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sun,
  DollarSign,
  Package,
  Plus,
  MoreHorizontal,
  MapPin,
  Car,
  Settings,
  LogOut,
  Receipt,
  BarChart3,
  Wrench,
  Users,
  MessageSquare,
  Calendar,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { FeedbackDialog } from "@/components/shared/FeedbackDialog";
import { useMyTeamPermissions } from "@/hooks/useMyTeamPermissions";

interface MobileBottomNavProps {
  onQuickAddOpen: () => void;
}

type NavItem = { path: string; icon: React.ComponentType<{ className?: string }>; label: string };

const operationsItems: NavItem[] = [
  { path: "/today", icon: Sun, label: "Today" },
  { path: "/leads", icon: Users, label: "Leads" },
  { path: "/locations", icon: MapPin, label: "Locations" },
  { path: "/maintenance", icon: Wrench, label: "Maintenance" },
  { path: "/mileage", icon: Car, label: "Routes" },
  { path: "/inventory", icon: Package, label: "Inventory" },
];

const financialsItems: NavItem[] = [
  { path: "/revenue", icon: DollarSign, label: "Revenue" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
  { path: "/receipts", icon: Receipt, label: "Receipts" },
];

const managementItems: NavItem[] = [
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/team", icon: UsersRound, label: "Team" },
];

export function MobileBottomNav({ onQuickAddOpen }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const permissions = useMyTeamPermissions();
  const [moreOpen, setMoreOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const allMainTabs = [
    { path: "/", icon: LayoutDashboard, label: "Home" },
    { path: "/locations", icon: MapPin, label: "Locations" },
    { path: "quick-add", icon: Plus, label: "Add", isAction: true },
    { path: "/revenue", icon: DollarSign, label: "Revenue" },
    { path: "more", icon: MoreHorizontal, label: "More", isMenu: true },
  ];

  const mainTabs = useMemo(() => {
    if (permissions.isLoading) return allMainTabs;
    return allMainTabs.filter(tab => {
      if (tab.path === "/locations") return permissions.isOwner || permissions.canViewLocations;
      if (tab.path === "/revenue") return permissions.isOwner || permissions.canViewRevenue;
      return true;
    });
  }, [permissions]);

  const filteredOperationsItems = useMemo(() => {
    if (permissions.isLoading) return operationsItems;
    return operationsItems.filter(item => {
      if (item.path === "/leads") return permissions.isOwner || permissions.canViewLeads;
      if (item.path === "/locations") return permissions.isOwner || permissions.canViewLocations;
      if (item.path === "/maintenance") return permissions.isOwner || permissions.canViewMaintenance;
      if (item.path === "/inventory") return permissions.isOwner || permissions.canViewInventory;
      if (item.path === "/mileage") return permissions.isOwner || permissions.canViewMileage;
      return true;
    });
  }, [permissions]);

  const filteredFinancialsItems = useMemo(() => {
    if (permissions.isLoading) return financialsItems;
    return financialsItems.filter(item => {
      if (item.path === "/revenue") return permissions.isOwner || permissions.canViewRevenue;
      if (item.path === "/reports") return permissions.isOwner || permissions.canViewReports;
      if (item.path === "/receipts") return permissions.isOwner || permissions.canViewRevenue;
      return true;
    });
  }, [permissions]);

  const filteredManagementItems = useMemo(
    () => (permissions.isOwner ? managementItems : []),
    [permissions]
  );

  const handleTabClick = (tab: typeof mainTabs[0]) => {
    if (tab.isAction) {
      onQuickAddOpen();
    } else if (!tab.isMenu) {
      navigate(tab.path);
    }
  };

  const handleMoreItemClick = (item: { path: string }) => {
    navigate(item.path);
    setMoreOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setMoreOpen(false);
  };

  const renderMoreSection = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1">
          {title}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleMoreItemClick(item)}
                className={cn(
                  "min-h-[72px] rounded-lg border flex flex-col items-center justify-center gap-1.5 px-2 transition-colors",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-accent/10"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border mobile-safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {mainTabs.map((tab) => {
          const isActive = !tab.isAction && !tab.isMenu && location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.isMenu) {
            return (
              <Sheet key={tab.path} open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button
                    className="flex flex-col items-center justify-center flex-1 py-2 min-w-0 min-h-[44px]"
                    aria-label="More navigation"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] mt-1 text-muted-foreground truncate">
                      {tab.label}
                    </span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl overflow-hidden px-4 pb-6">
                  <SheetHeader className="text-left pb-3">
                    <SheetTitle className="text-base">All sections</SheetTitle>
                  </SheetHeader>
                  <div className="mobile-sheet-scroll max-h-[65vh] space-y-4">
                    {renderMoreSection("Operations", filteredOperationsItems)}
                    {renderMoreSection("Financials & Reports", filteredFinancialsItems)}
                    {renderMoreSection("Management", filteredManagementItems)}

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1">
                        Account
                      </h3>
                      <Button
                        variant="outline"
                        className="w-full justify-start min-h-[44px]"
                        onClick={() => handleMoreItemClick({ path: "/settings" })}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start min-h-[44px]"
                        onClick={() => {
                          setMoreOpen(false);
                          setFeedbackOpen(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            );
          }

          if (tab.isAction) {
            return (
              <button
                key={tab.path}
                onClick={() => handleTabClick(tab)}
                className="flex flex-col items-center justify-center flex-1 py-2 min-w-0"
                aria-label="Quick add"
              >
                <div className="p-2.5 rounded-full bg-primary text-primary-foreground shadow-md -mt-4 transition-transform active:scale-95">
                  <Icon className="h-6 w-6" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => handleTabClick(tab)}
              className="flex flex-col items-center justify-center flex-1 py-2 min-w-0 min-h-[44px]"
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span
                className={cn(
                  "text-[10px] mt-1 truncate",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </nav>
  );
}
