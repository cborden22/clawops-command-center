import { FileText, Receipt, Sparkles, Package, DollarSign, MapPin, LayoutDashboard } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
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

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Locations", url: "/locations", icon: MapPin },
  { title: "Revenue Tracker", url: "/revenue", icon: DollarSign },
  { title: "Inventory Tracker", url: "/inventory", icon: Package },
  { title: "Commission Summary", url: "/commission-summary", icon: Receipt },
  { title: "Location Agreement Generator", url: "/documents", icon: FileText },
]

export function AppSidebar() {
  const location = useLocation()

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

      <SidebarFooter className="p-6 border-t border-white/10">
        <p className="text-xs text-muted-foreground">
          Copyright © {new Date().getFullYear()} ClawOps
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
