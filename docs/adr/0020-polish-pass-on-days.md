# 0020 - Polish pass on days

**Date**: 2026-10-01
**Module**: days
**Status**: Accepted

## Context
The module was designed (`proto-design`), hardened and functionally complete; the system-level polish rules were already applied by the `review-session` pass (ADR 0018) and the shared `Input` and row-size changes by the `note-filing` pass (ADR 0019). Quality bar: flagship; no deadline pressure.

## Decision
Aligned to the design system and resolved drift by root cause.
- **Missing token / scale**: the shadcn `xs` and `sm` button sizes set text at 12px and 12.8px, below the 14px floor in `docs/DESIGN.md`; both are now 14px (and one step taller), which fixes every small button in the app, not only the Today list.
- **Accessibility, label in name**: the backlog's start button had a spoken name that did not contain its visible text. The visible label is now "Start backlog review" and the counter reads "N open days, oldest first"; the Continue / Finish buttons keep names that begin with their visible text.
- **Interaction flow**: when a quick-type button is pressed the row changes shape and the button disappears, which dropped keyboard focus to the page. Focus now follows the user to the row's "Change" control (and into the type choices when "Change" is pressed).
- **States**: the backlog disclosure ("Show all open days") has a visible focus ring.
Reviewed and left unchanged: heading hierarchy (the three block headings share one size and weight), the single primary button, copy and capitalization, the "review" vocabulary, the card surfaces and spacing from the design pass, and the tabular figures.
Deferred: the skeleton on first render and an in-flight state (both depend on the real API, see `docs/modules/days-edgecases.md`); browser verification, which this environment could not run.

## Impact
The module ships. `connection` still gets its own polish pass. Re-run `proto-audit` later for a fresh baseline on evolved code.
