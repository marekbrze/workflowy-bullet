# 0016 - Hi-fi design applied to days

**Date**: 2026-10-01
**Module**: days
**Status**: Accepted

## Context
The module was a neutral lo-fi. `docs/DESIGN.md` defined the visual direction, and the token layer, type system, themes and shared components were already laid down by the `review-session` pass (ADR 0014).

## Decision
Reviewed the home screen against DESIGN.md and kept the inherited tokens and type scale. Module-specific changes: the Today list and the Backlog panel sit on the card surface (lifted paper, not the canvas), counters and statuses use tabular figures, and the home screen keeps a single primary button (Yesterday's Start) with the other actions as outlines so the accent marks only what to do next. One spacing rule now covers the whole app: a screen-level card uses `p-6` on the card surface and an inline panel or notice uses `p-4`; the rule was applied to the other modules' cards too (summary, empty states, connect screen, invalid-key and unreadable-data notices, skeleton). Register: product.

## Impact
The module is high-fidelity and on-brand. `proto-polish` is the final pass. Verified by lint, typecheck and build, not in a browser.
