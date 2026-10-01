# 0002 - Recent destinations are limited to 5

**Date**: 2026-10-01
**Module**: note-filing
**Status**: Accepted

## Context
While detailing `note-filing`, the designer was asked how many recently used destinations the picker should remember. `ENTITY_MAP.md` only said "last few used".

## Decision
The `recent` list holds the last 5 used destinations. Pinned destinations are separate and do not count toward the limit.

## Impact
`ENTITY_MAP.md` — `SavedDestination` description updated with the concrete limit.
