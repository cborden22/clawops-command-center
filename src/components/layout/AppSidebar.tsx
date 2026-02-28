import { useState, useEffect, useMemo } from "react"
import { FileText, Receipt, Sparkles, Package, DollarSign, MapPin, LayoutDashboard, LogOut, Settings, ChevronRight, ChevronDown, Car, BarChart3, Wrench, Users, UsersRound, Calendar, Map } from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useMyTeamPermissions } from "@/hooks/useMyTeamPermissions"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const operationsItems = [
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Locations", url: "/locations", icon: MapPin },
  { title: "Location Map", url: "/map", icon: Map },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Routes", url: "/mileage", icon: Car },
  { title: "Inventory Tracker", url: "/inventory", icon: Package },
]

const financialsItems = [
  { title: "Revenue Tracker", url: "/revenue", icon: DollarSign },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Commission Summary", url: "/commission-summary", icon: Receipt },
  { title: "Agreement Generator", url: "/documents", icon: FileText },
]

const managementItems = [
  { title: "Team", url: "/team", icon: UsersRound },
  { title: "Calendar", url: "/calendar", icon: Calendar },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const permissions = useMyTeamPermissions()

  // Filter operations items based on permissions
  const filteredOperationsItems = useMemo(() => {
    if (permissions.isLoading) return operationsItems
    return operationsItems.filter(item => {
      if (item.url === "/leads") return permissions.isOwner || permissions.canViewLeads
      if (item.url === "/locations") return permissions.isOwner || permissions.canViewLocations
      if (item.url === "/map") return permissions.isOwner || permissions.canViewLocations
      if (item.url === "/maintenance") return permissions.isOwner || permissions.canViewMaintenance
      if (item.url === "/inventory") return permissions.isOwner || permissions.canViewInventory
      if (item.url === "/mileage") return permissions.isOwner || permissions.canViewMileage
      return true
    })
  }, [permissions])

  // Filter financials items based on permissions
  const filteredFinancialsItems = useMemo(() => {
    if (permissions.isLoading) return financialsItems
    return financialsItems.filter(item => {
      if (item.url === "/revenue") return permissions.isOwner || permissions.canViewRevenue
      if (item.url === "/reports") return permissions.isOwner || permissions.canViewReports
      if (item.url === "/commission-summary") return permissions.isOwner || permissions.canViewDocuments
      if (item.url === "/documents") return permissions.isOwner || permissions.canViewDocuments
      return true
    })
  }, [permissions])

  // Management section only visible to owners
  const showManagement = permissions.isOwner

  // Check if current route is in a group (use filtered items)
  const isInOperations = filteredOperationsItems.some(item => location.pathname === item.url)
  const isInFinancials = filteredFinancialsItems.some(item => location.pathname === item.url)
  const isInManagement = showManagement && managementItems.some(item => location.pathname === item.url)

  // State for collapsible groups - auto-expand if contains active route
  const [operationsOpen, setOperationsOpen] = useState(isInOperations)
  const [financialsOpen, setFinancialsOpen] = useState(isInFinancials)
  const [managementOpen, setManagementOpen] = useState(isInManagement)

  // Auto-expand when navigating to a route in a group
  useEffect(() => {
    if (isInOperations) setOperationsOpen(true)
    if (isInFinancials) setFinancialsOpen(true)
    if (isInManagement) setManagementOpen(true)
  }, [isInOperations, isInFinancials, isInManagement])

  const handleSignOut = async () => {
    await signOut()
  }

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U"

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"

  const renderNavItem = (item: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }) => (
    <SidebarMenuItem key={item.title} className="p-0">
      <NavLink
        to={item.url}
        className={({ isActive }) =>
          `group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
            isActive 
              ? "bg-gradient-to-r from-gold-500/20 to-gold-600/10 text-gold-500 font-semibold shadow-lg" 
              : "hover:bg-white/5 hover:text-gold-400 hover:scale-105"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className={`p-2 rounded-lg transition-all duration-300 ${
              isActive 
                ? "bg-gold-500 text-primary-foreground shadow-lg" 
                : "bg-white/5 group-hover:bg-gold-500/20"
            }`}>
              <item.icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium flex-1">{item.title}</span>
            {isActive && (
              <div className="w-2 h-8 bg-gradient-to-b from-gold-500 to-gold-600 rounded-full shadow-glow ml-2" />
            )}
          </>
        )}
      </NavLink>
    </SidebarMenuItem>
  )

  return (
    <Sidebar className="glass-card border-r border-white/10">
      <SidebarContent>
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl opacity-20 blur animate-glow" />
            </div>
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
                ClawOps
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Professional Suite</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarMenu className="px-4">
          {/* Dashboard - Standalone */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenuItem className="p-0">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                      isActive 
                        ? "bg-gradient-to-r from-gold-500/20 to-gold-600/10 text-gold-500 font-semibold shadow-lg" 
                        : "hover:bg-white/5 hover:text-gold-400 hover:scale-105"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? "bg-gold-500 text-primary-foreground shadow-lg" 
                          : "bg-white/5 group-hover:bg-gold-500/20"
                      }`}>
                        <LayoutDashboard className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium flex-1">Dashboard</span>
                      {isActive && (
                        <div className="w-2 h-8 bg-gradient-to-b from-gold-500 to-gold-600 rounded-full shadow-glow ml-2" />
                      )}
                    </>
                  )}
                </NavLink>
              </SidebarMenuItem>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Operations Group */}
          {filteredOperationsItems.length > 0 && (
            <SidebarGroup>
              <Collapsible open={operationsOpen} onOpenChange={setOperationsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gold-500 hover:text-gold-400 transition-colors">
                    <span>Operations</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${operationsOpen ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
                  <SidebarGroupContent className="space-y-2">
                    {filteredOperationsItems.map(renderNavItem)}
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}

          {/* Financials & Reports Group */}
          {filteredFinancialsItems.length > 0 && (
            <SidebarGroup>
              <Collapsible open={financialsOpen} onOpenChange={setFinancialsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gold-500 hover:text-gold-400 transition-colors">
                    <span>Financials & Reports</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${financialsOpen ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
                  <SidebarGroupContent className="space-y-2">
                    {filteredFinancialsItems.map(renderNavItem)}
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}

          {/* Management Group - Only visible to owners */}
          {showManagement && (
            <SidebarGroup>
              <Collapsible open={managementOpen} onOpenChange={setManagementOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gold-500 hover:text-gold-400 transition-colors">
                    <span>Management</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${managementOpen ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
                  <SidebarGroupContent className="space-y-2">
                    {managementItems.map(renderNavItem)}
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 h-auto p-3 hover:bg-white/5"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-gold-500 to-gold-600 text-primary-foreground text-sm font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Copyright © {new Date().getFullYear()} ClawOps
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
