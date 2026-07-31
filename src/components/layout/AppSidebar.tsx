import { useMemo } from "react"
import {
  Sparkles,
  Package,
  DollarSign,
  MapPin,
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronRight,
  Car,
  BarChart3,
  Wrench,
  Users,
  UsersRound,
  Calendar,
  Receipt,
} from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useMyTeamPermissions } from "@/hooks/useMyTeamPermissions"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

// Daily-use destinations, flat and always visible.
const primaryItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Locations", url: "/locations", icon: MapPin },
  { title: "Revenue", url: "/revenue", icon: DollarSign },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Routes", url: "/mileage", icon: Car },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
]

// Lower-frequency destinations, still one click away.
const secondaryItems: NavItem[] = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Receipts", url: "/receipts", icon: Receipt },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Team", url: "/team", icon: UsersRound },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const permissions = useMyTeamPermissions()
  const { isPro, isTrial, trialEnd, isComplimentary, subscriptionStatus, isLoading: subscriptionLoading } = useFeatureAccess()

  const canSee = useMemo(() => {
    return (url: string) => {
      if (permissions.isLoading) return true
      switch (url) {
        case "/leads":
          return permissions.isOwner || permissions.canViewLeads
        case "/locations":
          return permissions.isOwner || permissions.canViewLocations
        case "/maintenance":
          return permissions.isOwner || permissions.canViewMaintenance
        case "/inventory":
          return permissions.isOwner || permissions.canViewInventory
        case "/mileage":
          return permissions.isOwner || permissions.canViewMileage
        case "/revenue":
          return permissions.isOwner || permissions.canViewRevenue
        case "/reports":
          return permissions.isOwner || permissions.canViewReports
        case "/receipts":
          return permissions.isOwner || permissions.canViewRevenue
        case "/team":
        case "/calendar":
          return permissions.isOwner
        default:
          return true
      }
    }
  }, [permissions])

  const filteredPrimary = useMemo(
    () => primaryItems.filter((item) => canSee(item.url)),
    [canSee]
  )
  const filteredSecondary = useMemo(
    () => secondaryItems.filter((item) => canSee(item.url)),
    [canSee]
  )

  const handleSignOut = async () => {
    await signOut()
  }

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U"

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.url} className="p-0">
      <NavLink
        to={item.url}
        end={item.url === "/"}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-md pl-4 pr-3 py-2.5 text-sm transition-colors ${
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-primary" />
            )}
            <item.icon
              className={`h-4 w-4 shrink-0 ${
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              }`}
            />
            <span className="truncate">{item.title}</span>
          </>
        )}
      </NavLink>
    </SidebarMenuItem>
  )

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent>
        <SidebarHeader className="px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-base text-sidebar-foreground truncate">
                ClawOps
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Operations suite
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {filteredPrimary.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredSecondary.length > 0 && (
          <SidebarGroup className="px-2 mt-2 border-t border-sidebar-border pt-3">
            <SidebarGroupLabel className="px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Insights &amp; Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {filteredSecondary.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto p-2 hover:bg-sidebar-accent"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <p className="text-[11px] text-muted-foreground text-center mt-3">
          © {new Date().getFullYear()} ClawOps
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
