import { describe, expect, it } from "vitest";
import { analyzingLeaveCancelsJob, leaveDecision } from "../leaveGuard";

describe("leave guard", () => {
  it("never drops an in-progress take or a write already in flight", () => {
    expect(leaveDecision({ screen: "capture", recording: true })).toBe("block");
    expect(leaveDecision({ screen: "capture", recording: false })).toBe("allow");
    expect(leaveDecision({ screen: "review", busy: true, mediaKind: "recorded" })).toBe("block");
    expect(leaveDecision({ screen: "result", busy: true, outcomeRecorded: true })).toBe("block");
  });

  it("asks before discarding a recorded take or leaving a result with no call", () => {
    expect(leaveDecision({ screen: "review", mediaKind: "recorded" })).toBe("confirm");
    expect(leaveDecision({ screen: "review", mediaKind: "imported" })).toBe("allow");
    expect(leaveDecision({ screen: "result", outcomeRecorded: false })).toBe("confirm");
    expect(leaveDecision({ screen: "result", outcomeRecorded: true })).toBe("allow");
  });

  it("lets the skater leave analyzing without cancelling the job", () => {
    expect(leaveDecision({ screen: "analyzing" })).toBe("allow");
    expect(analyzingLeaveCancelsJob()).toBe(false);
  });
});
