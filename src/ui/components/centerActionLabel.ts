import type { CenterAction } from "@/domain/centerAction";

/** Presentation lines for the center action. Does not change routing. */
export function centerActionLines(action: CenterAction): readonly string[] {
  if (action === "HYDRATING") return [];
  if (action === "CHOOSE TRICK") return ["CHOOSE", "TRICK"];
  return [action];
}
