# 0019 - Polish pass on note-filing

**Date**: 2026-10-01
**Module**: note-filing
**Status**: Accepted

## Context
The module was designed (`proto-design`), hardened and functionally complete; the system-level polish rules (placeholder contrast, 44px touch targets, hidden keyboard hints, shared link, "review" vocabulary, 14px information text) were already applied by the `review-session` pass (ADR 0018). Quality bar: flagship; no deadline pressure.

## Decision
Aligned to the design system and resolved drift by root cause.
- **One-off implementation → shared component**: the search field and the API-key field carried the same long class string; both now use one `Input` (`src/components/ui/input.tsx`) with the 36px height, the ≥3:1 boundary and the brand focus ring.
- **Missing state**: result rows had no hover state; they now do (the highlighted row keeps the accent as the current selection).
- **Hierarchy**: the primary content of a row — the place name here, the entry text on the Today list — is body text at 16px; paths and statuses stay at 14px.
Reviewed and left unchanged: copy and capitalization (sentence case, periods only on sentences, "place" used consistently), dialog width and scrolling on small screens, the live result count, focus on open (the search field), the error inside the picker, and the touch targets (covered by the base rule).
Deferred: browser verification, which this environment could not run.

## Impact
The module ships. `days` and `connection` still get their own polish pass. Re-run `proto-audit` later for a fresh baseline on evolved code.
