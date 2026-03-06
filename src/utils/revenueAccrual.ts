import { differenceInDays, max, min } from "date-fns";

interface AccrualEntry {
  amount: number;
  date: Date;
  type: string;
  servicePeriodStart?: Date | null;
  servicePeriodEnd?: Date | null;
}

/**
 * Calculate the proportional amount of a revenue entry that falls within a query date range.
 * 
 * For entries WITH a service period (income spread across collection interval):
 *   - Calculates what fraction of the service period overlaps with the query range
 *   - Returns proportional amount
 * 
 * For entries WITHOUT a service period (expenses, or legacy income):
 *   - Returns full amount if the entry date is within the query range, 0 otherwise
 * 
 * Example: $1,400 collected March 4th, service period Feb 20 – Mar 4 (14 days)
 *   Query: Feb 1–28 → overlap Feb 20–28 = 9 days → $1,400 × 9/14 = $900
 *   Query: Mar 1–31 → overlap Mar 1–4 = 4 days → $1,400 × 4/14 ≈ $400
 *   (Note: start day counts, so Feb 20–28 = 9 days, Mar 1–4 = 4 days, total = 13... 
 *    We use inclusive counting: 14 total days in the period)
 */
export function spreadEntryAcrossDateRange(
  entry: AccrualEntry,
  queryStart: Date,
  queryEnd: Date
): number {
  // Only spread income entries with service period data
  if (
    entry.type !== "income" ||
    !entry.servicePeriodStart ||
    !entry.servicePeriodEnd
  ) {
    // Fallback: full amount if entry date is in range
    const entryTime = entry.date.getTime();
    if (entryTime >= queryStart.getTime() && entryTime <= queryEnd.getTime()) {
      return entry.amount;
    }
    return 0;
  }

  const periodStart = entry.servicePeriodStart;
  const periodEnd = entry.servicePeriodEnd;

  // Total days in the service period (inclusive: +1)
  const totalDays = differenceInDays(periodEnd, periodStart) + 1;
  if (totalDays <= 0) {
    // Invalid period, treat as point-in-time
    const entryTime = entry.date.getTime();
    if (entryTime >= queryStart.getTime() && entryTime <= queryEnd.getTime()) {
      return entry.amount;
    }
    return 0;
  }

  // Calculate overlap between service period and query range
  const overlapStart = max([periodStart, queryStart]);
  const overlapEnd = min([periodEnd, queryEnd]);

  const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
  if (overlapDays <= 0) return 0;

  // Pro-rata amount
  return (entry.amount * overlapDays) / totalDays;
}

/**
 * Sum up accrual-adjusted income for an array of entries within a date range.
 */
export function getAccruedIncome(
  entries: AccrualEntry[],
  queryStart: Date,
  queryEnd: Date
): number {
  return entries
    .filter((e) => e.type === "income")
    .reduce((sum, entry) => sum + spreadEntryAcrossDateRange(entry, queryStart, queryEnd), 0);
}
