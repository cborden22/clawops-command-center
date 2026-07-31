export const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/revenue": "Revenue",
  "/inventory": "Inventory",
  "/locations": "Locations",
  "/mileage": "Routes",
  "/leads": "Leads",
  "/maintenance": "Maintenance",
  "/reports": "Reports",
  "/receipts": "Receipts",
  "/settings": "Settings",
  "/team": "Team",
  "/calendar": "Calendar",
  "/compliance": "Compliance",
  "/documents": "Documents",
};

export function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const base = "/" + pathname.split("/").filter(Boolean)[0];
  return pageTitles[base] || "ClawOps";
}
