# 0021 - Polish pass on connection

**Date**: 2026-10-01
**Module**: connection
**Status**: Accepted

## Context
The module was designed (`proto-design`), hardened and functionally complete; the system-level polish rules (placeholder contrast, 44px touch targets, hidden keyboard hints, shared link, "review" vocabulary, 14px information text, shared `Input`, 14px button text) were already applied by the earlier polish passes (ADRs 0018–0020). Quality bar: flagship; no deadline pressure.

## Decision
Aligned to the design system and resolved drift by root cause.
- **Conceptual misalignment (hierarchy)**: page-level titles had two sizes (the invalid-key and unreadable-data notices were `text-lg`, the rest `text-xl`), and the "Tree snapshot" block heading was `text-sm` while the same kind of heading on the home screen is `text-lg`. Every page title is now `text-xl` and every block heading `text-lg`.
- **Color**: body text in the error-tinted notices was the muted gray, which the system forbids on a colored background; it now uses ink (13.6:1 light, 13.1:1 dark).
- **Forms / a11y**: the API-key field is marked `aria-required`; the Show / Hide control had both a changing label and `aria-pressed`, which a screen reader announces twice over — it is now one control with a changing label and `aria-controls` pointing at the field.
Reviewed and left unchanged: the form's validation timing (on submit, consistently), the connect-screen and dialog copy, the status colors (words carry the meaning), focus handling after connecting and after saving a key, the dev-only simulate panel (hidden in production), and the snapshot line's calm styling for a stale tree.
Deferred: browser verification, which this environment could not run.

## Impact
All four modules have been polished. The app does what it did before, only more precisely. Re-run `proto-audit` later for a fresh baseline on evolved code.
