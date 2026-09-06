import { describe, expect, it } from "vitest";
import { touchTarget } from "../layout";

describe("phase 13 touch targets", () => {
  it("meets the 48pt minimum on primary controls", () => {
    expect(touchTarget.minimum).toBeGreaterThanOrEqual(48);
    expect(touchTarget.primaryButton).toBeGreaterThanOrEqual(touchTarget.minimum);
    expect(touchTarget.outcomeSelector).toBeGreaterThanOrEqual(touchTarget.minimum);
    expect(touchTarget.captureControl).toBeGreaterThanOrEqual(touchTarget.minimum);
  });
});
