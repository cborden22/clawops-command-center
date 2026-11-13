import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BulkRack, BulkMachine } from "@/lib/bulkVending";

async function ownerId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data } = await supabase.rpc("get_effective_owner_id", { current_user_id: user.id });
  return (data as string) || user.id;
}

export function useBulkRacks(locationId?: string | null) {
  const [racks, setRacks] = useState<BulkRack[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!locationId) { setRacks([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("bulk_racks")
      .select("id, location_id, name, notes, created_at, bulk_tiers(id, position, bulk_machines(*))")
      .eq("location_id", locationId)
      .order("created_at");
    if (!error && data) {
      setRacks(data.map((r: any) => ({
        id: r.id, location_id: r.location_id, name: r.name, notes: r.notes,
        tiers: [...(r.bulk_tiers || [])].sort((a, b) => a.position - b.position).map((t: any) => ({
          id: t.id,
          machines: [...(t.bulk_machines || [])].sort((a, b) => a.position - b.position).map((m: any) => ({ ...m, vend_price: Number(m.vend_price) })),
        })),
      })));
    }
    setLoading(false);
  }, [locationId]);

  useEffect(() => { load(); }, [load]);
  return { racks, loading, reload: load };
}

export async function saveRack(rack: BulkRack, isNew: boolean) {
  const uid = await ownerId();
  const { error: rErr } = await supabase.from("bulk_racks").upsert({ id: rack.id, user_id: uid, location_id: rack.location_id, name: rack.name || "Rack", notes: rack.notes });
  if (rErr) throw rErr;
  if (!isNew) {
    const { data: oldTiers } = await supabase.from("bulk_tiers").select("id, bulk_machines(id)").eq("rack_id", rack.id);
    const keepTiers = new Set(rack.tiers.map((t) => t.id));
    const keepMachines = new Set(rack.tiers.flatMap((t) => t.machines.map((m) => m.id)));
    const dropTiers = (oldTiers || []).filter((t: any) => !keepTiers.has(t.id)).map((t: any) => t.id);
    const dropMachines = (oldTiers || []).flatMap((t: any) => t.bulk_machines || []).map((m: any) => m.id).filter((id: string) => !keepMachines.has(id));
    if (dropMachines.length) await supabase.from("bulk_machines").delete().in("id", dropMachines);
    if (dropTiers.length) await supabase.from("bulk_tiers").delete().in("id", dropTiers);
  }
  if (rack.tiers.length) {
    const { error } = await supabase.from("bulk_tiers").upsert(rack.tiers.map((t, i) => ({ id: t.id, user_id: uid, rack_id: rack.id, position: i })));
    if (error) throw error;
  }
  const rows = rack.tiers.flatMap((t) => t.machines.map((m, i) => ({
    id: m.id, user_id: uid, tier_id: t.id, position: i, machine_type: m.machine_type,
    product_name: m.product_name?.trim() || null, vend_price: m.vend_price, fill_percent: m.fill_percent,
    capacity: m.capacity, last_restocked_at: m.last_restocked_at, nayax_device_id: m.nayax_device_id,
  })));
  if (rows.length) {
    const { error } = await supabase.from("bulk_machines").upsert(rows);
    if (error) throw error;
  }
}

export async function deleteRack(id: string) {
  const { error } = await supabase.from("bulk_racks").delete().eq("id", id);
  if (error) throw error;
}

export async function updateBulkMachine(id: string, patch: Partial<BulkMachine>) {
  const { error } = await supabase.from("bulk_machines").update(patch).eq("id", id);
  if (error) throw error;
}

/** Location IDs with any bulk head under the low-fill threshold. */
export async function fetchLowBulkLocationIds(threshold = 50): Promise<Set<string>> {
  const { data } = await supabase
    .from("bulk_machines")
    .select("id, bulk_tiers!inner(bulk_racks!inner(location_id))")
    .lt("fill_percent", threshold);
  return new Set((data || []).map((m: any) => m.bulk_tiers?.bulk_racks?.location_id).filter(Boolean));
}
