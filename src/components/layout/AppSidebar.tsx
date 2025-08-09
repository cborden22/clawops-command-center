
import { FileText, Receipt, MapPin, Image } from "lucide-react"
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
  { title: "Location Agreement Generator", url: "/documents", icon: FileText },
  { title: "Commission Summary", url: "/commission-summary", icon: Receipt },
  { title: "Route Planner", url: "/route-planner", icon: MapPin },
  { title: "Flyer & Poster Generator", url: "/flyer-generator", icon: Image },
]

export function AppSidebar() {
  const location = useLocation()
  const active = items.find((item) => item.url === location.pathname)

  return (
    <Sidebar className="bg-secondary border-r">
      <SidebarContent>
        <SidebarHeader>
          <SidebarMenuButton />
          <h1 className="font-semibold text-lg">ClawOps</h1>
        </SidebarHeader>

        <SidebarMenu>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="p-0">
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-smooth ${
                        isActive ? "bg-accent font-medium" : ""
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <p className="text-xs text-muted-foreground">
          Copyright © {new Date().getFullYear()} ClawOps
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
