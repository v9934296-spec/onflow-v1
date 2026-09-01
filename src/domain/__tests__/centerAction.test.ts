import { describe, expect, it } from "vitest";
import { resolveCenterAction } from "../centerAction";

describe("center action", () => {
  it("disables the center action while session state is hydrating", () => {
    expect(
      resolveCenterAction({
        hydrating: true,
        hasSession: true,
        hasTrick: true,
        hasRecoverableDraft: true,
      }),
    ).toBe("HYDRATING");
  });

  it("resumes a recoverable outbox draft before normal session actions", () => {
    expect(
      resolveCenterAction({
        hydrating: false,
        hasSession: true,
        hasTrick: true,
        hasRecoverableDraft: true,
      }),
    ).toBe("RESUME");
  });

  it("starts a free-skate session when none is active", () => {
    expect(
      resolveCenterAction({
        hydrating: false,
        hasSession: false,
        hasTrick: false,
        hasRecoverableDraft: false,
      }),
    ).toBe("START");
  });

  it("asks for a trick before filming", () => {
    expect(
      resolveCenterAction({
        hydrating: false,
        hasSession: true,
        hasTrick: false,
        hasRecoverableDraft: false,
      }),
    ).toBe("CHOOSE TRICK");
  });

  it("films when session and trick are present", () => {
    expect(
      resolveCenterAction({
        hydrating: false,
        hasSession: true,
        hasTrick: true,
        hasRecoverableDraft: false,
      }),
    ).toBe("FILM");
  });
});
