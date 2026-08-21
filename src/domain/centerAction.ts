export type CenterAction = "START" | "CHOOSE TRICK" | "FILM" | "RESUME" | "HYDRATING";

export function resolveCenterAction(input: {
  hydrating: boolean;
  hasSession: boolean;
  hasTrick: boolean;
  hasRecoverableDraft: boolean;
}): CenterAction {
  if (input.hydrating) return "HYDRATING";
  if (input.hasRecoverableDraft) return "RESUME";
  if (!input.hasSession) return "START";
  if (!input.hasTrick) return "CHOOSE TRICK";
  return "FILM";
}
