import { ReactNode, useState } from "react";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { QuickAddSheet } from "../mobile/QuickAddSheet";
import { MobileRefreshProvider, useMobileRefresh } from "@/contexts/MobileRefreshContext";
import { UpdateNotification } from "@/components/shared/UpdateNotification";

interface MobileLayoutProps {
  children: ReactNode;
}

function MobileLayoutInner({ children }: MobileLayoutProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { isRefreshing, triggerRefresh } = useMobileRefresh();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader onRefresh={triggerRefresh} isRefreshing={isRefreshing} />
      <UpdateNotification />
      <main 
        className="flex-1 overflow-y-auto overscroll-contain mobile-scroll-optimized"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'max(80px, calc(64px + env(safe-area-inset-bottom)))'
        }}
      >
        {children}
      </main>
      <MobileBottomNav onQuickAddOpen={() => setQuickAddOpen(true)} />
      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  );
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <MobileRefreshProvider>
      <MobileLayoutInner>{children}</MobileLayoutInner>
    </MobileRefreshProvider>
  );
}
