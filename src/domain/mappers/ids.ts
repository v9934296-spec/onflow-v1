import { unsafeBrand } from "../types/brand";
import type { AttemptId, ClipId, JobId, LocalId, SessionId, TrickId, UserId } from "../types/ids";

export function mintLocalId(raw: string): LocalId {
  return unsafeBrand<LocalId>(raw);
}

export function mintUserId(raw: string): UserId {
  return unsafeBrand<UserId>(raw);
}

export function mintSessionId(raw: string): SessionId {
  return unsafeBrand<SessionId>(raw);
}

export function mintClipId(raw: string): ClipId {
  return unsafeBrand<ClipId>(raw);
}

export function mintJobId(raw: string): JobId {
  return unsafeBrand<JobId>(raw);
}

export function mintAttemptId(raw: string): AttemptId {
  return unsafeBrand<AttemptId>(raw);
}

export function mintTrickId(raw: string): TrickId {
  return unsafeBrand<TrickId>(raw);
}
