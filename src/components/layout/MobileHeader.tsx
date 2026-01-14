import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/revenue": "Revenue",
  "/inventory": "Inventory",
  "/locations": "Locations",
  "/mileage": "Mileage",
  "/documents": "Documents",
  "/settings": "Settings",
  "/commission-summary": "Commission",
  "/compliance": "Compliance",
};

export function MobileHeader() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "ClawOps";

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          <span>Online</span>
        </div>
      </div>
    </header>
  );
}
