import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  MapPin,
  DollarSign,
  Package,
  Users,
  Wrench,
  Car,
  BarChart3,
  Receipt,
  Calendar,
  UsersRound,
  Settings,
  Plus,
  Search,
  Clock,
  Sparkles,
  Command,
} from "lucide-react";
import { useMyTeamPermissions } from "@/hooks/useMyTeamPermissions";
import { useLocations } from "@/hooks/useLocationsDB";
import { useLeadsDB } from "@/hooks/useLeadsDB";
import { useInventory } from "@/hooks/useInventoryDB";
import { cn } from "@/lib/utils";

const RECENT_ROUTES_KEY = "clawops_recent_routes";

interface NavItem {
  id: string;
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  requires?: keyof ReturnType<typeof useMyTeamPermissions>;
}

const jumpItems: NavItem[] = [
  { id: "dashboard", title: "Dashboard", url: "/", icon: LayoutDashboard },
  { id: "locations", title: "Locations", url: "/locations", icon: MapPin, requires: "canViewLocations" },
  { id: "revenue", title: "Revenue", url: "/revenue", icon: DollarSign, requires: "canViewRevenue" },
  { id: "inventory", title: "Inventory", url: "/inventory", icon: Package, requires: "canViewInventory" },
  { id: "leads", title: "Leads", url: "/leads", icon: Users, requires: "canViewLeads" },
  { id: "maintenance", title: "Maintenance", url: "/maintenance", icon: Wrench, requires: "canViewMaintenance" },
  { id: "routes", title: "Routes", url: "/mileage", icon: Car, requires: "canViewMileage" },
  { id: "reports", title: "Reports", url: "/reports", icon: BarChart3, requires: "canViewReports" },
  { id: "receipts", title: "Receipts", url: "/receipts", icon: Receipt, requires: "canViewRevenue" },
  { id: "calendar", title: "Calendar", url: "/calendar", icon: Calendar },
  { id: "team", title: "Team", url: "/team", icon: UsersRound },
  { id: "settings", title: "Settings", url: "/settings", icon: Settings },
];

const actionItems = [
  { id: "add-location", title: "Add location", url: "/locations", icon: Plus },
  { id: "add-lead", title: "Add lead", url: "/leads", icon: Plus },
  { id: "add-inventory", title: "Add inventory", url: "/inventory", icon: Plus },
  { id: "add-revenue", title: "Add revenue entry", url: "/revenue", icon: Plus },
  { id: "add-route", title: "Create route", url: "/mileage", icon: Plus },
];

function getRecentRoutes(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_ROUTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentRoute(url: string) {
  try {
    const recent = getRecentRoutes();
    const next = [url, ...recent.filter((r) => r !== url)].slice(0, 5);
    localStorage.setItem(RECENT_ROUTES_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = useMyTeamPermissions();
  const { locations, isLoaded: locationsLoaded } = useLocations();
  const { leads, isLoading: leadsLoading } = useLeadsDB();
  const { items: inventoryItems, isLoaded: inventoryLoaded } = useInventory();

  const [query, setQuery] = useState("");

  // Track recent routes
  useEffect(() => {
    if (location.pathname && location.pathname !== "/") {
      saveRecentRoute(location.pathname);
    }
  }, [location.pathname]);

  const filteredJumpItems = useMemo(() => {
    if (permissions.isLoading) return jumpItems;
    return jumpItems.filter((item) => {
      if (!item.requires) return true;
      return permissions.isOwner || permissions[item.requires];
    });
  }, [permissions]);

  const recentRoutes = useMemo(() => getRecentRoutes(), [open]);
  const recentItems = useMemo(() => {
    return recentRoutes
      .map((url) => jumpItems.find((item) => item.url === url))
      .filter(Boolean) as NavItem[];
  }, [recentRoutes]);

  const recordResults = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    const results: { id: string; title: string; subtitle: string; url: string; icon: React.ComponentType<{ className?: string }> }[] = [];

    if (locationsLoaded) {
      locations
        .filter((loc) => loc.name?.toLowerCase().includes(q))
        .slice(0, 4)
        .forEach((loc) => {
          results.push({
            id: `loc-${loc.id}`,
            title: loc.name,
            subtitle: "Location",
            url: `/locations`,
            icon: MapPin,
          });
        });
    }

    if (!leadsLoading) {
      leads
        .filter((lead) => lead.business_name?.toLowerCase().includes(q))
        .slice(0, 4)
        .forEach((lead) => {
          results.push({
            id: `lead-${lead.id}`,
            title: lead.business_name,
            subtitle: "Lead",
            url: `/leads`,
            icon: Users,
          });
        });
    }

    if (inventoryLoaded) {
      inventoryItems
        .filter((item) => item.name?.toLowerCase().includes(q))
        .slice(0, 4)
        .forEach((item) => {
          results.push({
            id: `item-${item.id}`,
            title: item.name,
            subtitle: "Inventory",
            url: `/inventory`,
            icon: Package,
          });
        });
    }

    return results.slice(0, 8);
  }, [query, locations, locationsLoaded, leads, leadsLoading, inventoryItems, inventoryLoaded]);

  const handleSelect = useCallback(
    (url: string) => {
      onOpenChange(false);
      navigate(url);
      setQuery("");
    },
    [navigate, onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search pages, records, or actions..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {query.length === 0 && recentItems.length > 0 && (
          <CommandGroup heading="Recent">
            {recentItems.map((item) => (
              <CommandItem key={item.id} onSelect={() => handleSelect(item.url)}>
                <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{item.title}</span>
                <CommandShortcut>
                  <Clock className="h-3 w-3" />
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {query.length === 0 && <CommandSeparator />}

        <CommandGroup heading="Jump to">
          {filteredJumpItems.map((item) => (
            <CommandItem key={item.id} onSelect={() => handleSelect(item.url)}>
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {query.length === 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick actions">
              {actionItems.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item.url)}>
                  <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {recordResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Records">
              {recordResults.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item.url)}>
                  <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
      <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" />K open
          </span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          ClawOps
        </span>
      </div>
    </CommandDialog>
  );
}

export function CommandPaletteButton({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground",
        className
      )}
      aria-label="Open command palette"
    >
      <Search className="h-4 w-4" />
      <span className="hidden lg:inline">Search...</span>
      <kbd className="hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium">
        <Command className="h-3 w-3" />K
      </kbd>
    </button>
  );
}
