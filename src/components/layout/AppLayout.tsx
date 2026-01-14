import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { MobileLayout } from "./MobileLayout"
import { ReactNode } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  // Mobile layout with bottom navigation
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  // Desktop layout with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background font-inter relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/2 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}} />
        </div>

        <AppSidebar />
        
        <div className="flex-1 flex flex-col relative z-10">
          <header className="h-16 flex items-center justify-between px-6 glass-header">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-accent/50 rounded-lg p-2 transition-smooth hover:scale-105" />
              <div className="h-6 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-glow" />
                <span className="text-sm text-muted-foreground font-medium">Professional Tools</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>System Online</span>
              </div>
            </div>
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
