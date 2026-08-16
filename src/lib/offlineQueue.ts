import { get, set, del, keys, createStore } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";

const store = createStore("clawops-offline", "queue");

export type QueuedOp =
  | {
      id: string;
      kind: "insert";
      table: string;
      payload: Record<string, any>;
      createdAt: number;
      label: string;
    }
  | {
      id: string;
      kind: "update";
      table: string;
      payload: Record<string, any>;
      match: Record<string, any>;
      createdAt: number;
      label: string;
    }
  | {
      id: string;
      kind: "upload";
      bucket: string;
      path: string;
      blob: Blob;
      contentType?: string;
      createdAt: number;
      label: string;
    };

function newId() {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function enqueue(op: Omit<QueuedOp, "id" | "createdAt">): Promise<string> {
  const id = newId();
  const full = { ...op, id, createdAt: Date.now() } as QueuedOp;
  await set(id, full, store);
  return id;
}

export async function listQueue(): Promise<QueuedOp[]> {
  const allKeys = await keys(store);
  const ops: QueuedOp[] = [];
  for (const k of allKeys) {
    const op = await get<QueuedOp>(k as string, store);
    if (op) ops.push(op);
  }
  return ops.sort((a, b) => a.createdAt - b.createdAt);
}

export async function queueCount(): Promise<number> {
  return (await keys(store)).length;
}

export async function clearQueue(): Promise<void> {
  const allKeys = await keys(store);
  await Promise.all(allKeys.map((k) => del(k as string, store)));
}

async function runOp(op: QueuedOp): Promise<void> {
  if (op.kind === "insert") {
    const { error } = await supabase.from(op.table as any).insert(op.payload as any);
    if (error) throw error;
    return;
  }
  if (op.kind === "update") {
    let query = supabase.from(op.table as any).update(op.payload as any) as any;
    for (const [col, value] of Object.entries(op.match)) {
      query = query.eq(col, value);
    }
    const { error } = await query;
    if (error) throw error;
    return;
  }
  const { error } = await supabase.storage
    .from(op.bucket)
    .upload(op.path, op.blob, { contentType: op.contentType, upsert: true });
  if (error) throw error;
}

export interface DrainResult {
  synced: number;
  failed: number;
  remaining: number;
}

/** Runs queued operations oldest-first. Stops on the first failure so ordering is preserved. */
export async function drainQueue(): Promise<DrainResult> {
  const ops = await listQueue();
  let synced = 0;
  let failed = 0;

  for (const op of ops) {
    try {
      await runOp(op);
      await del(op.id, store);
      synced++;
    } catch (error) {
      console.error("Offline sync failed for op", op.id, error);
      failed++;
      break;
    }
  }

  return { synced, failed, remaining: await queueCount() };
}

export function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
