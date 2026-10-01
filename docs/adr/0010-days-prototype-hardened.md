# 0010 - days prototype hardened

**Date**: 2026-10-01
**Module**: days
**Status**: Accepted

## Context
The module's prototype handled happy paths but not edge cases (see `docs/modules/days-edgecases.md`). Four gaps needed a design decision: when and how the home screen flags stale data, how a mis-tapped quick-type is corrected, whether a note typed from the list can be filed, and whether tasks rolled over to tomorrow are shown.

## Decision
Implemented 11 of 13 edge-case states: unreadable stored data detected and backed up (shared storage hook) with a recovery message, one shared rule for typing an entry, reconciled session counts, a "today" that follows midnight and focus, a freshness cue, plus wrapping, limits and accessible names.
Designer decisions: (1) after one hour the snapshot line reads "Your tree may be out of date" with Refresh, no alarm colors; (2) typed rows get a quiet "Change"; (3) a note row gets "File…" / "Move…" using the same picker; (4) one quiet "N tasks waiting for tomorrow" line.
Deferred: skeleton on first render (#12) and in-flight state for quick-typing (#13) — nothing is async in the prototype yet.

## Impact
`ACTIONS.md` — quick-typing includes correcting a type; a note can be filed from the Today list. `useLocalStorage` returns a fourth value (`{ unreadable, startFresh }`) and `useToday` is a new shared hook, both usable by every module. `typeEntry` in `session-logic.ts` is now the single classification rule. Visual polish remains a separate `proto-design` pass.
