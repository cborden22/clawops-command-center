import { FileText, Receipt, Sparkles, Package, DollarSign, MapPin, LayoutDashboard, LogOut, Settings, ChevronRight, Car, BarChart3, Wrench } from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
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

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Locations", url: "/locations", icon: MapPin },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Revenue Tracker", url: "/revenue", icon: DollarSign },
  { title: "Routes", url: "/mileage", icon: Car },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Inventory Tracker", url: "/inventory", icon: Package },
  { title: "Commission Summary", url: "/commission-summary", icon: Receipt },
  { title: "Location Agreement Generator", url: "/documents", icon: FileText },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U"

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"

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
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-gold-500 mb-4">
              Main Tools
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-2">
              {items.map((item) => (
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
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
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
