import type { Location } from "@/hooks/useLocationsDB";
import type { MachineCollection } from "@/hooks/useMachineCollections";
import { generateCSV, downloadCSV } from "@/utils/csvExport";

const money = (n: number) => n.toFixed(2);

/** Effective commission % for a machine: its own rate, else the location rate. */
export function machineRate(machineRate: number | undefined | null, locationRate: number): number {
  return machineRate != null && !Number.isNaN(machineRate) ? machineRate : locationRate || 0;
}

/** Builds a CSV of one location: info, machines with per-machine commission, and statements. */
export function buildLocationCSV(location: Location, collections: MachineCollection[]): string {
  const rows: string[][] = [];
  rows.push(["LOCATION"]);
  rows.push(["Name", location.name]);
  rows.push(["Address", location.address || ""]);
  rows.push(["Contact", location.contactPerson || ""]);
  rows.push(["Phone", location.contactPhone || ""]);
  rows.push(["Email", location.contactEmail || ""]);
  rows.push(["Status", location.isActive ? "Active" : "Inactive"]);
  rows.push(["Total machines", String(location.machineCount)]);
  rows.push(["Default commission %", String(location.commissionRate || 0)]);
  rows.push([]);

  rows.push(["MACHINES"]);
  rows.push(["Type", "Name", "Count", "Unit code", "Nayax ID", "Installed", "Commission %", "Collected revenue", "Commission owed on collected"]);
  let totRev = 0, totComm = 0;
  for (const m of location.machines || []) {
    const rate = machineRate(m.commissionRate, location.commissionRate);
    const rev = m.id
      ? collections.filter((c) => c.machineId === m.id).reduce((s, c) => s + c.coinsInserted * (m.costPerPlay || 0), 0)
      : 0;
    const comm = (rev * rate) / 100;
    totRev += rev; totComm += comm;
    rows.push([m.label || m.type, m.customLabel || "", String(m.count), m.unitCode || "", m.nayaxId || "", m.installedAt || "", String(rate), money(rev), money(comm)]);
  }
  rows.push(["Total", "", String(location.machineCount), "", "", "", "", money(totRev), money(totComm)]);
  rows.push([]);

  rows.push(["COMMISSION STATEMENTS"]);
  rows.push(["Start", "End", "Machines", "Revenue", "Commission %", "Commission", "Paid", "Paid on"]);
  for (const s of location.commissionSummaries || []) {
    rows.push([s.startDate, s.endDate, String(s.machineCount), money(s.totalRevenue), String(s.commissionPercentage), money(s.commissionAmount), s.commissionPaid ? "Yes" : "No", s.commissionPaidAt ? s.commissionPaidAt.slice(0, 10) : ""]);
  }
  return generateCSV([], rows);
}

export function exportLocationCSV(location: Location, collections: MachineCollection[]) {
  const slug = location.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  downloadCSV(buildLocationCSV(location, collections), `${slug}-location-export-${new Date().toISOString().slice(0, 10)}.csv`);
}
