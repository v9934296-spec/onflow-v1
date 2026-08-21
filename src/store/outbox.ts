import { mintLocalId } from "../domain/mappers/ids";
import type { LocalId } from "../domain/types/ids";
import type { OutboxRow } from "../domain/models";

const SCHEMA_VERSION = 1;
const rows = new Map<string, OutboxRow>();

export async function initOutbox(): Promise<void> {
  // SQLite is opened by the native module in Wave 3. The in-memory map is the
  // durable stand-in for unit tests and keeps the schema-version rule in one place.
}

export async function upsertOutbox(row: OutboxRow): Promise<void> {
  if (row.schemaVersion !== SCHEMA_VERSION) return;
  rows.set(row.localId, row);
}

export async function getOutbox(localId: string): Promise<OutboxRow | null> {
  return rows.get(localId) ?? null;
}

export async function listOutboxForUser(userId: string): Promise<OutboxRow[]> {
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

export async function sealedRowsForOtherAccount(signedInUserId: string): Promise<OutboxRow[]> {
  return [...rows.values()].filter((row) => row.ownerUserId !== signedInUserId);
}

export function newLocalId(): LocalId {
  const id =
    globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random()}`;
  return mintLocalId(id);
}
