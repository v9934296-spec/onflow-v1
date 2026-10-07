import { mintLocalId } from "../domain/mappers/ids";
import type { LocalId } from "../domain/types/ids";
import type { OutboxRow } from "../domain/models";
import { kv, kvKeys } from "./kv";

const SCHEMA_VERSION = 1;
const rows = new Map<string, OutboxRow>();
let hydrated = false;

function persist(): void {
  kv.set(kvKeys.outbox, JSON.stringify([...rows.values()]));
}

function ensureHydrated(): void {
  if (hydrated) return;
  hydrated = true;
  const raw = kv.get(kvKeys.outbox);
  if (!raw) return;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const row = item as OutboxRow;
      if (row.schemaVersion !== SCHEMA_VERSION || typeof row.localId !== "string") continue;
      rows.set(row.localId, row);
    }
  } catch {
    kv.delete(kvKeys.outbox);
  }
}

export async function initOutbox(): Promise<void> {
  ensureHydrated();
}

export async function upsertOutbox(row: OutboxRow): Promise<void> {
  ensureHydrated();
  if (row.schemaVersion !== SCHEMA_VERSION) return;
  rows.set(row.localId, row);
  persist();
}

export async function getOutbox(localId: string): Promise<OutboxRow | null> {
  ensureHydrated();
  return rows.get(localId) ?? null;
}

export async function listOutboxForUser(userId: string): Promise<OutboxRow[]> {
  ensureHydrated();
  return [...rows.values()].filter((row) => row.ownerUserId === userId);
}

export async function listRecoverable(userId: string): Promise<OutboxRow[]> {
  return (await listOutboxForUser(userId)).filter(
    (row) =>
      row.state !== "ready" &&
      row.state !== "cancelled" &&
      row.state !== "failed_permanent",
  );
}

/** Drops the outbox reference only. Imported camera-roll files are never touched. */
export async function cancelOutbox(localId: string): Promise<void> {
  const row = await getOutbox(localId);
  if (!row) return;
  await upsertOutbox({ ...row, state: "cancelled", errorKind: null });
}

export async function discardRecoverable(userId: string): Promise<void> {
  const recoverable = await listRecoverable(userId);
  for (const row of recoverable) {
    await cancelOutbox(row.localId);
  }
}

export async function sealedRowsForOtherAccount(signedInUserId: string): Promise<OutboxRow[]> {
  ensureHydrated();
  return [...rows.values()].filter((row) => row.ownerUserId !== signedInUserId);
}

export function newLocalId(): LocalId {
  const id =
    globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random()}`;
  return mintLocalId(id);
}

/** Clears in-memory outbox state (Vitest only — module singleton). */
export function resetOutboxStoreForTests(): void {
  rows.clear();
  hydrated = false;
}
