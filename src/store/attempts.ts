import { syncAttempts } from "../api/endpoints";
import type { Attempt, AttemptOutcome } from "../domain/models";
import { mintAttemptId } from "../domain/mappers/ids";
import { confirmationFacts, sessionDurationLabel } from "../domain/saveConfirmation";
import { toCatalogErrorKind, type CatalogErrorKind } from "../domain/outbox";
import { useSessionStore } from "./sessionStore";
import { kv, kvKeys } from "./kv";

function attemptsKey(userId: string): string {
  return `${kvKeys.sessionAttempts}:${userId}`;
}

function pendingKey(userId: string): string {
  return `${kvKeys.pendingAttempts}:${userId}`;
}

function readAttempts(userId: string): Attempt[] {
  const raw = kv.get(attemptsKey(userId));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Attempt[]) : [];
  } catch {
    return [];
  }
}

function writeAttempts(userId: string, attempts: Attempt[]): void {
  kv.set(attemptsKey(userId), JSON.stringify(attempts));
}

function readPending(userId: string): string[] {
  const raw = kv.get(pendingKey(userId));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writePending(userId: string, ids: string[]): void {
  kv.set(pendingKey(userId), JSON.stringify(ids));
}

function addPending(userId: string, id: string): void {
  const ids = readPending(userId);
  if (ids.includes(id)) return;
  writePending(userId, [...ids, id]);
}

function removePending(userId: string, id: string): void {
  writePending(
    userId,
    readPending(userId).filter((row) => row !== id),
  );
}

export function listLocalAttempts(userId: string): Attempt[] {
  return readAttempts(userId);
}

export function purgeLocalAttempts(userId: string): void {
  kv.delete(attemptsKey(userId));
  kv.delete(pendingKey(userId));
}

export async function drainPendingAttempts(userId: string): Promise<void> {
  const pending = readPending(userId);
  if (pending.length === 0) return;
  const byId = new Map<string, Attempt>(readAttempts(userId).map((row) => [row.id, row]));
  const batch = pending.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });
  if (batch.length === 0) {
    writePending(userId, []);
    return;
  }
  const synced = await syncAttempts(batch);
  if (!synced.ok) return;
  writePending(userId, []);
}

export async function reportOutcomeAndMaybeContinue(
  userId: string,
  outcome: AttemptOutcome,
): Promise<
  | { ok: true; facts: readonly string[] }
  | { ok: false; kind: CatalogErrorKind }
> {
  const { session, trick } = useSessionStore.getState();
  if (!session || !trick) return { ok: false, kind: "session_missing" };

  const attempt: Attempt = {
    id: mintAttemptId(globalThis.crypto?.randomUUID?.() ?? `att-${Date.now()}`),
    sessionId: session.id,
    trickId: trick.trickId,
    canonicalName: trick.canonicalName,
    outcome,
    loggedAt: new Date().toISOString(),
  };
  const stored = [...readAttempts(userId), attempt];
  writeAttempts(userId, stored);
  addPending(userId, attempt.id);

  const synced = await syncAttempts([attempt]);
  if (synced.ok && synced.data.rejected.some((row) => row.id === attempt.id)) {
    writeAttempts(
      userId,
      stored.filter((row) => row.id !== attempt.id),
    );
    removePending(userId, attempt.id);
    return { ok: false, kind: "attempt_conflict" };
  }
  if (!synced.ok && synced.error.kind !== "offline" && synced.error.kind !== "server") {
    writeAttempts(
      userId,
      stored.filter((row) => row.id !== attempt.id),
    );
    removePending(userId, attempt.id);
    return { ok: false, kind: toCatalogErrorKind(synced.error.kind, "unknown") };
  }
  if (synced.ok) removePending(userId, attempt.id);

  const attemptNumber = stored.filter((row) => row.sessionId === session.id && row.trickId === trick.trickId).length;
  return {
    ok: true,
    facts: confirmationFacts({
      trick: trick.canonicalName,
      outcome,
      attemptNumber,
      durationLabel: sessionDurationLabel(session.startedAt),
    }),
  };
}
