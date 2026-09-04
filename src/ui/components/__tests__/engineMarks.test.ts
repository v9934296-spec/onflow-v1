import { describe, expect, it } from "vitest";
import { engineRingDashOffset, tickCountFilled, TRANSPARENT_OVER_ASPHALT } from "../engineMarks";

describe("Grok instrument marks", () => {
  it("fills ticks from a 0–1 progress without inventing overflow", () => {
    expect(tickCountFilled(0, 28)).toBe(0);
    expect(tickCountFilled(0.5, 28)).toBe(14);
    expect(tickCountFilled(2, 28)).toBe(28);
  });

  it("omits a ring stroke when the engine returned no score", () => {
    expect(engineRingDashOffset(null, 100)).toBeNull();
    expect(engineRingDashOffset(Number.NaN, 100)).toBeNull();
    expect(engineRingDashOffset(10, 100)).toBe(0);
    expect(engineRingDashOffset(0, 100)).toBe(100);
  });

  it("keeps asphalt-overlay chrome transparent", () => {
    expect(TRANSPARENT_OVER_ASPHALT.backgroundColor).toBe("transparent");
  });
});
