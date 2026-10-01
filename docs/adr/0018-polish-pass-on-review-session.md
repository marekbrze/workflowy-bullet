# 0018 - Polish pass on review-session

**Date**: 2026-10-01
**Module**: review-session
**Status**: Accepted

## Context
The module was designed (`proto-design`), hardened and functionally complete. A pre-ship polish pass was needed. Quality bar: flagship; no deadline pressure.

## Decision
Aligned to the design system first and resolved drift by root cause, then polished.
- **Missing system rules** (added to the base layer, so every module gains them): placeholder text uses the muted ink token (the default failed 4.5:1); buttons, summaries and nav links are at least 44px tall on coarse pointers.
- **One-off implementations** swapped for shared components: three underlined links with no focus ring became `TextLink`; keyboard hints (`Kbd`) are now hidden from assistive tech and touch screens, and the controls carry `aria-keyshortcuts` instead, so a shortcut is no longer read as part of a button's name.
- **Conceptual misalignment** (words): the same activity was "session" in some places and "review" in others. The interface now says "review" everywhere ("Yesterday's review", "End review", "Review finished"); `ReviewSession` stays a code term. `docs/GLOSSARY.md` and `docs/DESIGN.md` record this.
- **Typography**: information-bearing meta (day, counters, statuses, chips, paths) is 14px, not 12px; 12px is left for keyboard hints only. The decision prompt ("What is this?") now reads as the question, in ink at medium weight.
- **States**: the children disclosure on the entry card has a visible focus ring.
Deferred: web font preload (the build hashes the file name); verification in a browser, which this environment could not run.

## Impact
The module ships. The system-level changes also reach `note-filing`, `days` and `connection`, which still get their own polish pass. Re-run `proto-audit` later for a fresh baseline on evolved code.
