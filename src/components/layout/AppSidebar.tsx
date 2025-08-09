import { FileText, Calculator, Users, BarChart3, Receipt } from "lucide-react"
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
  useSidebar,
} from "@/components/ui/sidebar"

const items = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Machine Calculator", url: "/calculator", icon: Calculator },
  { title: "Lead Tracker", url: "/leads", icon: Users },
  { title: "Commission Summary", url: "/commission-summary", icon: Receipt },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  const getNavClasses = (path: string) => {
    return isActive(path) 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
  }

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"}>
      <SidebarContent className="bg-card border-r">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-xl text-foreground">ClawOps</h1>
                <p className="text-xs text-muted-foreground">Business Dashboard</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="px-3">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth ${getNavClasses(item.url)}`}
                    >
                       <item.icon className="h-5 w-5" />
                       {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
