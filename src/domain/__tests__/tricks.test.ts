import { describe, expect, it } from "vitest";
import {
  filterTricks,
  mimeFromUri,
  nearestTricks,
  popularFromRecent,
  rememberRecentId,
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

  it("builds popular only from real recent ids", () => {
    expect(popularFromRecent(catalog, ["heelflip", "heelflip", "kickflip"]).map((t) => t.name)).toEqual([
      "Heelflip",
      "Kickflip",
    ]);
  });

  it("maps MOV uris to quicktime and everything else to mp4", () => {
    expect(mimeFromUri("file:///clip.MOV")).toBe("video/quicktime");
    expect(mimeFromUri("file:///clip.mp4?cache=1")).toBe("video/mp4");
  });
});
