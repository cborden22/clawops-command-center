import { ReactNode, useState } from "react";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { QuickAddSheet } from "../mobile/QuickAddSheet";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader />
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <MobileBottomNav onQuickAddOpen={() => setQuickAddOpen(true)} />
      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  );
}
