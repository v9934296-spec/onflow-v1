import { color, space, radius, touchTarget, textStyle } from "../tokens";
import { errorCopy, type ErrorKind } from "../copy/errors";

export { color, space, radius, touchTarget, textStyle, errorCopy };
export type { ErrorKind };

export const readinessCopy = {
  usable: { label: "Usable", body: "Enough of the clip was readable to review." },
  limited: { label: "Limited", body: "Parts of this clip were hard to read, so the notes are partial." },
  insufficient: {
    label: "Insufficient",
    body: "There wasn't enough readable footage for a full review. The clip is still saved.",
  },
} as const;
