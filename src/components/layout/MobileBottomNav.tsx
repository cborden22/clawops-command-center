import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, DollarSign, Package, Plus, MoreHorizontal, MapPin, Car, FileText, Settings, LogOut, Receipt, BarChart3, Wrench, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentsSheet } from "@/components/mobile/DocumentsSheet";
import { FeedbackDialog } from "@/components/shared/FeedbackDialog";
import { useMyTeamPermissions } from "@/hooks/useMyTeamPermissions";

interface MobileBottomNavProps {
  onQuickAddOpen: () => void;
}

const operationsItems = [
  { path: "/leads", icon: Users, label: "Leads" },
  { path: "/locations", icon: MapPin, label: "Locations" },
  { path: "/maintenance", icon: Wrench, label: "Maintenance" },
  { path: "/mileage", icon: Car, label: "Routes" },
  { path: "/inventory", icon: Package, label: "Inventory" },
];

const financialsItems = [
  { path: "/revenue", icon: DollarSign, label: "Revenue" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
  { path: "/receipts", icon: Receipt, label: "Receipts" },
  { path: "documents-picker", icon: FileText, label: "Documents", isDocuments: true },
];

export function MobileBottomNav({ onQuickAddOpen }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const permissions = useMyTeamPermissions();
  const [moreOpen, setMoreOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const allMainTabs = [
    { path: "/", icon: LayoutDashboard, label: "Home" },
    { path: "/revenue", icon: DollarSign, label: "Revenue" },
    { path: "quick-add", icon: Plus, label: "Add", isAction: true },
    { path: "/inventory", icon: Package, label: "Inventory" },
    { path: "more", icon: MoreHorizontal, label: "More", isMenu: true },
  ];

  // Filter main tabs based on permissions
  const mainTabs = useMemo(() => {
    if (permissions.isLoading) return allMainTabs;
    return allMainTabs.filter(tab => {
      if (tab.path === "/revenue") return permissions.isOwner || permissions.canViewRevenue;
      if (tab.path === "/inventory") return permissions.isOwner || permissions.canViewInventory;
      return true; // Dashboard, Add, More always visible
    });
  }, [permissions]);

  // Filter operations items in More menu
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

  // Filter financials items in More menu
  const filteredFinancialsItems = useMemo(() => {
    if (permissions.isLoading) return financialsItems;
    return financialsItems.filter(item => {
      if (item.path === "/revenue") return permissions.isOwner || permissions.canViewRevenue;
      if (item.path === "/reports") return permissions.isOwner || permissions.canViewReports;
      if (item.path === "/receipts") return permissions.isOwner || permissions.canViewRevenue;
      if (item.isDocuments) return permissions.isOwner || permissions.canViewDocuments;
      return true;
    });
  }, [permissions]);

  const handleTabClick = (tab: typeof mainTabs[0]) => {
    if (tab.isAction) {
      onQuickAddOpen();
    } else if (!tab.isMenu) {
      navigate(tab.path);
    }
  };

  const handleMoreItemClick = (item: { path: string; isDocuments?: boolean }) => {
    if (item.isDocuments) {
      setMoreOpen(false);
      setDocumentsOpen(true);
    } else {
      navigate(item.path);
      setMoreOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMoreOpen(false);
  };

  const renderMoreItem = (item: typeof operationsItems[0] & { isDocuments?: boolean }) => {
    const Icon = item.icon;
    const isActive = !item.isDocuments && location.pathname === item.path;
    return (
      <Button
        key={item.path}
        variant={isActive ? "default" : "outline"}
        className="h-14 flex-col gap-1"
        onClick={() => handleMoreItemClick(item)}
      >
        <Icon className="h-5 w-5" />
        <span className="text-xs">{item.label}</span>
      </Button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border mobile-safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {mainTabs.map((tab) => {
          const isActive = !tab.isAction && !tab.isMenu && location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.isMenu) {
            return (
              <Sheet key={tab.path} open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button
                    className="flex flex-col items-center justify-center flex-1 py-2 min-w-0"
                  >
                    <div className="p-1.5 rounded-lg transition-colors text-muted-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] mt-0.5 text-muted-foreground truncate">
                      {tab.label}
                    </span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl">
                  {/* Operations Section */}
                  {filteredOperationsItems.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                        Operations
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {filteredOperationsItems.map(renderMoreItem)}
                      </div>
                    </div>
                  )}

                  {filteredOperationsItems.length > 0 && filteredFinancialsItems.length > 0 && (
                    <Separator className="my-4" />
                  )}

                  {/* Financials & Reports Section */}
                  {filteredFinancialsItems.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                        Financials & Reports
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {filteredFinancialsItems.map(renderMoreItem)}
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  {/* Settings, Report Issue & Sign Out */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate("/settings");
                        setMoreOpen(false);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
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
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
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
              >
                <div className="p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg -mt-4 transition-transform hover:scale-105 active:scale-95">
                  <Icon className="h-6 w-6" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => handleTabClick(tab)}
              className="flex flex-col items-center justify-center flex-1 py-2 min-w-0"
            >
              <div
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 truncate",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <DocumentsSheet open={documentsOpen} onOpenChange={setDocumentsOpen} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </nav>
  );
}
