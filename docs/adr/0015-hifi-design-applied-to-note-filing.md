# 0015 - Hi-fi design applied to note-filing

**Date**: 2026-10-01
**Module**: note-filing
**Status**: Accepted

## Context
The module was a neutral lo-fi. `docs/DESIGN.md` defined the visual direction, and the token layer, type system, themes and shared components were already laid down by the `review-session` pass (ADR 0014).

## Decision
Reviewed the destination picker against DESIGN.md and kept the inherited tokens, type scale, focus ring, form-field borders (≥3:1) and dialog surface. Three module-specific changes: the highlighted row uses the accent (the current selection), a pinned star is shown in the primary color (a state indicator), and rows for places that are no longer in the tree use the muted text color instead of 60% opacity, which measured 3.57:1 against the 4.5:1 floor. Selected-row text measures 6.06:1 or better in both themes. Register: product.

## Impact
The module is high-fidelity and on-brand. `proto-polish` is the final pass. Verified by lint, typecheck, build and numeric contrast checks, not in a browser.
