# 0013 - Visual direction captured

**Date**: 2026-10-01
**Status**: Accepted

## Context
The prototype was a neutral lo-fi (shadcn defaults). A visual direction was needed before hi-fi implementation.

## Decision
Captured register, scene, color strategy with an OKLCH palette (contrast verified numerically), typography and motion in `docs/DESIGN.md`. Register: product. Strategy: Restrained, with a deep plum seed `oklch(0.44 0.13 335)` and neutrals tinted toward that hue. Scene: morning, daylight, calm — light theme by default, dark as a secondary theme. Personality: paper, warm, quiet. Typeface: Atkinson Hyperlegible Next, one sans for the whole interface. Motion: functional only, 150–250 ms.

## Impact
`proto-design` implements this per module, starting with the token layer in `src/index.css` and the shared components. `proto-polish` is the final pass. Re-run `proto-brand` to evolve the direction.
