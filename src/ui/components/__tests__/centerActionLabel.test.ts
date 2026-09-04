import { describe, expect, it } from "vitest";
import { centerActionLines } from "../centerActionLabel";

describe("centerActionLines", () => {
  it("splits choose-trick onto two lines", () => {
    expect(centerActionLines("CHOOSE TRICK")).toEqual(["CHOOSE", "TRICK"]);
  });

  it("keeps single-word actions intact", () => {
    expect(centerActionLines("START")).toEqual(["START"]);
    expect(centerActionLines("FILM")).toEqual(["FILM"]);
    expect(centerActionLines("RESUME")).toEqual(["RESUME"]);
  });

  it("hides copy while hydrating", () => {
    expect(centerActionLines("HYDRATING")).toEqual([]);
  });
});
