# 0006 - review-session prototype hardened

**Date**: 2026-10-01
**Module**: review-session
**Status**: Accepted

## Context
The module's prototype handled happy paths but not edge cases (see `docs/modules/review-session-edgecases.md`). Three gaps needed a design decision: what a resumed session does with new entries, how a completed-but-untyped entry is classified, and whether Change type belongs on the card.

## Decision
Implemented 14 of 16 edge-case states: storage writes that report failure (with an app-wide banner and an atomic, rollback-safe decision write), queue reconciliation, error recovery with retry and dismiss, a blocked undo for a changed roll-over copy, a skeleton, an unknown-review message, layout-independent hotkeys and cross-tab sync.
Designer decisions: (1) on resume, entries that arrived since the session started are added to the end of the queue with a one-line note; (2) a completed untyped entry classified as a task becomes a done task and is never re-opened — `Entry` gains a `completed` flag; (3) Change type is a quiet control on the task card with key G, and is undoable.
Deferred: in-flight state for writes (#9, no async yet) and rich WorkFlowy text (#15, needs a spec decision).

## Impact
`ENTITY_MAP.md` — Entry documents the `completed` flag. `ACTIONS.md` — Change type is now implemented on the card. `WriteErrorNotice` moved to `src/shared/components/` because the note picker uses it too. `useLocalStorage` now returns whether the write succeeded and syncs across tabs, which affects every module that uses it. Visual polish remains a separate `proto-design` pass.
