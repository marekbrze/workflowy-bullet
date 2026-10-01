# 0008 - note-filing prototype hardened

**Date**: 2026-10-01
**Module**: note-filing
**Status**: Accepted

## Context
The module's prototype handled happy paths but not edge cases (see `docs/modules/note-filing-edgecases.md`). Three gaps needed a design decision: what happens when a note that already has a mirror is filed again, how the picker lets the user back out without deciding, and how pinned places are ordered.

## Decision
Implemented 14 of 16 edge-case states (2 only in part): saved places checked against the current tree, existing mirror shown and moved or kept, the note itself excluded, shortened paths that keep the closest parents, "more results" hint, indexed and deferred search, empty-tree message, live rate-limit countdown, live result count, IME-safe Enter and a Shift+Enter pin shortcut.
Designer decisions: (1) an existing mirror is shown at the top of the picker; picking a new place moves it, "Keep as is" leaves it; (2) Back (and Backspace on an empty field) undoes the classification, Esc stays Keep in day; (3) pinned places are alphabetical, unbounded and scrollable.
Deferred: in-flight state (#9, no async yet); excluding the note's descendants and day node, and large-tree storage (#3, #8 in part — need the real tree shape).

## Impact
`decideNote` now leaves an existing mirror alone when the choice is "keep", and replaces it when a place is chosen, so a note has at most one mirror. `DestinationPicker` takes `currentMirror`, `excludeIds` and `onBack` from `review-session`. `ACTIONS.md` — pinning also works from the keyboard. Visual polish remains a separate `proto-design` pass.
