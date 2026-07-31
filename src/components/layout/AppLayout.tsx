import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { MobileLayout } from "./MobileLayout"
import { ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { useIsMobile } from "@/hooks/use-mobile"
import { UpdateNotification } from "@/components/shared/UpdateNotification"
import { getPageTitle } from "@/lib/navigation"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();

  // Mobile layout with bottom navigation
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  const title = getPageTitle(location.pathname);

  // Desktop layout with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background font-inter">
        <AppSidebar />
        <UpdateNotification />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 px-6 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30">
            <SidebarTrigger
              className="hover:bg-accent/10 rounded-md p-2 transition-colors"
              aria-label="Toggle navigation"
            />
            <div className="h-5 w-px bg-border" />
            <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
