import { describe, expect, it } from "vitest";
import {
  color,
  glow,
  MIN_BODY_FONT_SIZE,
  motionMs,
  radius,
  textStyle,
  touchTarget,
} from "../index";

/** WCAG relative luminance from a 6-digit hex. */
function luminance(hex: string): number {
  const channel = (index: number) => {
    const raw = Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
    return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The design system is a contract, not a mood board. These assertions pin the
 * decisions in docs/redesign-001-design-foundation.md so a later "just bump
 * the radius" cannot drift the product back toward a generic dark template.
 */
describe("design tokens", () => {
  it("keeps corner radii restrained", () => {
    for (const [name, value] of Object.entries(radius)) {
      if (name === "pill") continue;
      expect(value, name).toBeLessThanOrEqual(12);
    }
  });

  it("passes contrast for the primary action in both directions", () => {
    // Volt on background (text/icon) and background on volt (button label).
    expect(contrast(color.neon, color.bg)).toBeGreaterThanOrEqual(7);
  });

  it("keeps text readable outdoors", () => {
    expect(contrast(color.textPrimary, color.bg)).toBeGreaterThanOrEqual(7);
    expect(contrast(color.textSecondary, color.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color.alum, color.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color.amber, color.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color.red, color.bg)).toBeGreaterThanOrEqual(4.5);
    // Tertiary is for small technical labels only; UI-component threshold.
    expect(contrast(color.textTertiary, color.bg)).toBeGreaterThanOrEqual(3);
    // Destructive button label is bg on red.
    expect(contrast(color.bg, color.red)).toBeGreaterThanOrEqual(4.5);
  });

  it("meets touch target minimums", () => {
    for (const [name, value] of Object.entries(touchTarget)) {
      expect(value, name).toBeGreaterThanOrEqual(48);
    }
    expect(touchTarget.captureControl).toBeGreaterThanOrEqual(76);
  });

  it("keeps motion fast and physical", () => {
    for (const key of ["press", "enter", "exit"] as const) {
      expect(motionMs[key], key).toBeGreaterThanOrEqual(90);
      expect(motionMs[key], key).toBeLessThanOrEqual(220);
    }
  });

  it("carries no decorative glow", () => {
    expect(Object.keys(glow)).toEqual(["record"]);
  });

  it("never sets body text below the outdoor minimum", () => {
    expect(textStyle.body.fontSize).toBeGreaterThanOrEqual(MIN_BODY_FONT_SIZE);
    expect(textStyle.bodyLg.fontSize).toBeGreaterThanOrEqual(MIN_BODY_FONT_SIZE);
  });

  it("gives display type tight leading without clipping", () => {
    for (const key of ["slate", "slateSm", "hero", "h1", "h2"] as const) {
      const { fontSize, lineHeight } = textStyle[key];
      expect(lineHeight, key).toBeGreaterThanOrEqual(fontSize * 0.9);
      expect(lineHeight, key).toBeLessThanOrEqual(fontSize * 1.15);
    }
  });
});
