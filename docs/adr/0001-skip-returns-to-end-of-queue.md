# 0001 - Skip returns the entry to the end of the queue

**Date**: 2026-10-01
**Module**: review-session
**Status**: Accepted

## Context
While detailing `review-session`, the designer was asked what should happen when an entry is skipped. `ACTIONS.md` only said "move past the current entry without deciding", which left open whether the entry comes back.

## Decision
A skipped entry goes to the end of the current queue and is shown again after all other entries. The session cannot reach its summary while a skipped entry is unprocessed.

## Impact
`ACTIONS.md` — "Skip to next entry" description updated. Consistent with the `isClosed` rule: a skipped entry is still untyped or open, so its day stays open.
