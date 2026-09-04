import { describe, expect, it } from "vitest";
import { confirmationFacts, sessionDurationLabel } from "../saveConfirmation";

describe("save confirmation", () => {
  it("caps the confirmation screen at three facts", () => {
    expect(
      confirmationFacts({
        trick: "Kickflip",
        outcome: "landed",
        attemptNumber: 4,
        durationLabel: "12 min session",
      }),
    ).toEqual(["Kickflip", "Landed", "Attempt 4"]);
  });

  it("uses session duration when there is no attempt number", () => {
    expect(
      confirmationFacts({
        trick: "Heelflip",
        outcome: "missed",
        attemptNumber: null,
        durationLabel: "3 min session",
      }),
    ).toEqual(["Heelflip", "Missed", "3 min session"]);
  });

  it("labels session duration from startedAt without inventing clock time", () => {
    const start = "2026-09-01T12:00:00.000Z";
    const now = Date.parse("2026-09-01T12:18:00.000Z");
    expect(sessionDurationLabel(start, now)).toBe("18 min session");
    expect(sessionDurationLabel("not-a-date")).toBeNull();
  });
});
