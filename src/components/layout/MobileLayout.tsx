import { ReactNode, useState } from "react";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { QuickAddSheet } from "../mobile/QuickAddSheet";
import { MobileRefreshProvider, useMobileRefresh } from "@/contexts/MobileRefreshContext";
import { RefreshIndicator } from "../mobile/RefreshIndicator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface MobileLayoutProps {
  children: ReactNode;
}

function MobileLayoutInner({ children }: MobileLayoutProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { isRefreshing, triggerRefresh } = useMobileRefresh();
  
  const { pullDistance, containerRef } = usePullToRefresh({
    onRefresh: triggerRefresh,
    isRefreshing,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader onRefresh={triggerRefresh} isRefreshing={isRefreshing} />
      <main 
        ref={containerRef}
        className="flex-1 overflow-y-auto pb-20"
      >
        <RefreshIndicator 
          pullDistance={pullDistance} 
          isRefreshing={isRefreshing} 
        />
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
