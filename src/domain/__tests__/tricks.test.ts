import { describe, expect, it } from "vitest";
import {
  bumpUsage,
  filterTricks,
  mimeFromUri,
  nearestTricks,
  popularFromUsage,
  rememberRecentId,
  usageCount,
} from "../tricks";
import { mintTrickId } from "../mappers/ids";
import type { CatalogTrick } from "../models";

function trick(id: string, name: string, category = "flip", aliases: string[] = []): CatalogTrick {
  return {
    trickId: mintTrickId(id),
    name,
    category,
    aliases,
    difficultyTier: 1,
  };
}

describe("trick registry helpers", () => {
  const catalog = [
    trick("kickflip", "Kickflip", "flip", ["kick"]),
    trick("heelflip", "Heelflip", "flip"),
    trick("nollie-heel", "Nollie Heelflip", "flip"),
    trick("bs-lip", "Backside Lipslide", "grind"),
  ];

  it("caps search results at 12 and respects category", () => {
    expect(filterTricks(catalog, "", "grind")).toEqual([catalog[3]]);
    expect(filterTricks(catalog, "heel", null).map((t) => t.name)).toEqual([
      "Heelflip",
      "Nollie Heelflip",
    ]);
  });

  it("offers nearest registry names instead of inventing a custom trick", () => {
    expect(nearestTricks(catalog, "heel").map((t) => t.name)).toEqual([
      "Heelflip",
      "Nollie Heelflip",
    ]);
    expect(nearestTricks(catalog, "zzzz")).toEqual([]);
  });

  it("keeps recent order without duplicates", () => {
    expect(rememberRecentId(["a", "b"], "b")).toEqual(["b", "a"]);
  });

  it("counts how often a trick was actually called", () => {
    let usage = bumpUsage({}, "kickflip");
    usage = bumpUsage(usage, "heelflip");
    usage = bumpUsage(usage, "kickflip");
    expect(usageCount(usage, "kickflip")).toBe(2);
    expect(usageCount(usage, "heelflip")).toBe(1);
    expect(usageCount(usage, "never-called")).toBe(0);
  });

  it("keeps the usage tally bounded", () => {
    let usage: Record<string, number> = {};
    for (let i = 0; i < 80; i += 1) usage = bumpUsage(usage, `trick-${i}`);
    expect(Object.keys(usage).length).toBeLessThanOrEqual(60);
  });

  it("builds popular from real counts, not from the recent list", () => {
    // The recent list is de-duplicated, so counting it can only yield ones.
    const usage = { heelflip: 4, kickflip: 2, "bs-lip": 1 };
    expect(popularFromUsage(catalog, usage).map((t) => t.name)).toEqual(["Heelflip", "Kickflip"]);
  });

  it("does not call a trick popular after a single use", () => {
    expect(popularFromUsage(catalog, { kickflip: 1, heelflip: 1 })).toEqual([]);
  });

  it("ignores counts for tricks that are not in the registry", () => {
    expect(popularFromUsage(catalog, { "not-a-trick": 9, kickflip: 3 }).map((t) => t.name)).toEqual([
      "Kickflip",
    ]);
  });

  it("maps MOV uris to quicktime and everything else to mp4", () => {
    expect(mimeFromUri("file:///clip.MOV")).toBe("video/quicktime");
    expect(mimeFromUri("file:///clip.mp4?cache=1")).toBe("video/mp4");
  });
});
