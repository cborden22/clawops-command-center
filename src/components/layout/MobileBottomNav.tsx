import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, DollarSign, Package, Plus, MoreHorizontal, MapPin, Car, FileText, Settings, LogOut, Receipt, BarChart3, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentsSheet } from "@/components/mobile/DocumentsSheet";

interface MobileBottomNavProps {
  onQuickAddOpen: () => void;
}

export function MobileBottomNav({ onQuickAddOpen }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);

  const mainTabs = [
    { path: "/", icon: LayoutDashboard, label: "Home" },
    { path: "/revenue", icon: DollarSign, label: "Revenue" },
    { path: "quick-add", icon: Plus, label: "Add", isAction: true },
    { path: "/inventory", icon: Package, label: "Inventory" },
    { path: "more", icon: MoreHorizontal, label: "More", isMenu: true },
  ];

  const moreTabs = [
    { path: "/locations", icon: MapPin, label: "Locations" },
    { path: "/maintenance", icon: Wrench, label: "Maintenance" },
    { path: "/mileage", icon: Car, label: "Routes" },
    { path: "/reports", icon: BarChart3, label: "Reports" },
    { path: "/receipts", icon: Receipt, label: "Receipts" },
    { path: "documents-picker", icon: FileText, label: "Documents", isDocuments: true },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const handleTabClick = (tab: typeof mainTabs[0]) => {
    if (tab.isAction) {
      onQuickAddOpen();
    } else if (!tab.isMenu) {
      navigate(tab.path);
    }
  };

  const handleMoreItemClick = (moreTab: typeof moreTabs[0]) => {
    if (moreTab.isDocuments) {
      setMoreOpen(false);
      setDocumentsOpen(true);
    } else {
      navigate(moreTab.path);
      setMoreOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMoreOpen(false);
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
                <div className="grid grid-cols-2 gap-3 py-4">
                    {moreTabs.map((moreTab) => {
                      const MoreIcon = moreTab.icon;
                      const isMoreActive = !moreTab.isDocuments && location.pathname === moreTab.path;
                      return (
                        <Button
                          key={moreTab.path}
                          variant={isMoreActive ? "default" : "outline"}
                          className="h-16 flex-col gap-1"
                          onClick={() => handleMoreItemClick(moreTab)}
                        >
                          <MoreIcon className="h-5 w-5" />
                          <span className="text-xs">{moreTab.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t">
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
    </nav>
  );
}
