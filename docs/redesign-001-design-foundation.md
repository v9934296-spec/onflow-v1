# REDESIGN-001 — Design foundation (Phase 1)

**Date:** 2026-09-05  
**Status:** Implemented. Supersedes spec §10.1–10.3 for the V1 mobile redesign.  
**Owner decisions:** recorded in [redesign-000-phase-0-audit.md](./redesign-000-phase-0-audit.md).

Guardrails §15 says *do not redesign while implementing*. This document is the
amendment that makes the redesign a recorded decision rather than a pile of
unlogged deviations. Truth rules (§11), contract (§8), state ownership (§11.3)
and the media guardrails are untouched.

## What changed

| Token | Was | Now | Why |
|---|---|---|---|
| `color.neon` | `#00FFA6` | `#54FF00` | Owner decision B1. Raw signal green, not a soft mint. Contrast on bg ≈ 14.9:1 |
| `color.surface` / `surfaceAlt` | `#1A1A1A` / `#222222` | `#131313` / `#1C1C1C` | One step off bg. Surfaces are wells and pressed states, not cards |
| `color.hairline` | `#2A2A2A` | `#242424` | Quieter rules; structure without boxes |
| `color.red`, `media.recording` | `#FF3B3B` | **unchanged** | Locked decision 14 survives: red is never decorative |
| `radius` | `6 / 10 / 14 / pill` | `0 / 4 / 6 / 8 / 12 / pill` | Nothing above 12 without a reason |
| `border` | — | `hairline 1 · rule 2` | Named so rules stop being magic numbers |
| `motionMs` | `90 / 220 / 160` | `120 / 200 / 140` | Fast and physical; within the 120–220 band |
| `PRESS_SCALE_HARD` | — | `0.94` | The big physical controls compress harder |
| `glow.center` | neon drop shadow | **removed** | Decoration. The center action earns dominance by size + fill + a bg ring |
| `textStyle.slate` / `slateSm` | — | Bebas 60 / 34 | So a trick name can be the strongest element on a screen |
| `textStyle.meta` | — | Sora 600 · 11 · tracking 1.4 | The technical line: `REGULAR · ATTEMPT 07` |
| `textStyle.monoLg` | — | JetBrains 14 | Clocks and counts readable at arm's length |
| `dynamicTypeMaxScale.display` | — | `1.6` | Display is already large; let it grow less so layouts survive 200% |

## New primitives

| Component | Role |
|---|---|
| `OnFlowButton` | Three sizes (`hero` 76 · `primary` 56 · `compact` 48), four variants, native-driver press compression at `motionMs.press`, optional selection haptic. `hero` sets its label in display type |
| `OnFlowHeader` | Edge-to-edge masthead: display title, `OnFlowMeta` line, rule beneath. No container |
| `OnFlowDivider` | `hairline` / `rule` weights, optional inset and tone. Structure through rules, not boxes |
| `OnFlowMeta` / `MetaTag` | The dotted technical line and the glyph+word state tag. Never color-only |
| `FootageFrame` / `FootageThumbnail` | 16:9 letterboxed hero frame; square cropped contact-sheet cell with a mono mark. Missing media renders nothing |

`Button`, `ScreenHeader`, `ScreenHero`, `TrickCard`, `SessionCard`, `Chip` and
`VideoThumbnail` remain in place because every screen still uses them.
`VideoThumbnail` now delegates to `FootageFrame`. Each is retired in the phase
that redesigns its last consumer (see the audit's implementation order).

## Guardrails preserved

- Red is never decorative; the recording glow is the only glow.
- Volt means action or positive state. It carries hierarchy or state, never a wash.
- Body text is never uppercase. `meta`, button labels and `MetaTag` are labels, not body.
- Color is never the only indicator: `MetaTag` always carries a glyph.
- Touch minimums 48 / 56 / 64 / 76 unchanged.
- Missing media renders as nothing.

`src/ui/tokens/__tests__/tokens.test.ts` pins radii ≤ 12, WCAG contrast on
every text/accent color, touch minimums, the motion band, the absence of
decorative glow, and display leading.

## Verification

`tsc --noEmit` · `eslint .` · `verify:boundaries` · `api:check` · `vitest run`.
No screen composition changed in this phase; the visible differences are the
accent hue, tighter radii, and the center button losing its glow.

**Not verified on a device.** Bebas rendering at 60pt, the `#54FF00` accent in
sunlight, and the press motion have been reasoned about, not seen. That debt
carries forward from the Phase 0 gate audit.

## Next

Owner sequencing decision (2026-09-05): **skater personalization onboarding is
built on these primitives next**, then redesign Phase 2 (canonical session
flow) resumes.
