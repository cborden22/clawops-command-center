export type BulkMachineType = "2in_capsule" | "1in_capsule" | "loose_candy" | "bouncy_ball";

export const BULK_TYPES: Record<BulkMachineType, { label: string; short: string; price: number; capacity: number; capUnit: string; tall: boolean; swatch: string }> = {
  "2in_capsule": { label: '2" Capsule Tower', short: '2" capsule', price: 1, capacity: 250, capUnit: "capsules", tall: true, swatch: "hsl(var(--primary))" },
  "1in_capsule": { label: '1" Capsule / Gumball', short: '1" capsule', price: 0.5, capacity: 850, capUnit: "pieces", tall: false, swatch: "hsl(200 70% 55%)" },
  loose_candy: { label: "Loose Candy", short: "Candy", price: 0.25, capacity: 4, capUnit: "lb", tall: false, swatch: "hsl(330 70% 60%)" },
  bouncy_ball: { label: "Bouncy Ball (27mm)", short: "Bouncy ball", price: 0.5, capacity: 300, capUnit: "balls", tall: false, swatch: "hsl(140 55% 50%)" },
};

export const VEND_PRICES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
export const LOW_FILL = 50;

export interface BulkMachine {
  id: string;
  machine_type: BulkMachineType;
  product_name: string | null;
  vend_price: number;
  fill_percent: number;
  capacity: number | null;
  last_restocked_at: string | null;
  nayax_device_id: string | null;
}
export interface BulkTier { id: string; machines: BulkMachine[] }
export interface BulkRack { id: string; location_id: string; name: string; notes: string | null; tiers: BulkTier[] }

export function newMachine(type: BulkMachineType): BulkMachine {
  const t = BULK_TYPES[type];
  return { id: crypto.randomUUID(), machine_type: type, product_name: null, vend_price: t.price, fill_percent: 100, capacity: t.capacity, last_restocked_at: null, nayax_device_id: null };
}

export function rackStats(racks: BulkRack[]) {
  const all = racks.flatMap((r) => r.tiers.flatMap((t) => t.machines));
  const heads = all.length;
  return {
    heads,
    low: all.filter((m) => m.fill_percent < LOW_FILL).length,
    unlabeled: all.filter((m) => !m.product_name?.trim()).length,
    avgPrice: heads ? all.reduce((s, m) => s + Number(m.vend_price), 0) / heads : 0,
  };
}

export const money = (n: number) => `$${Number(n).toFixed(2)}`;
