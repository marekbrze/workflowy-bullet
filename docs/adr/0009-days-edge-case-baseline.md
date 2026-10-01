# 0009 - days edge-case baseline

**Date**: 2026-10-01
**Module**: days
**Status**: Accepted

## Context
The module's prototype handled happy paths but had not been stress-tested for edge cases.

## Decision
Audited into `docs/modules/days-edgecases.md`. 13 gaps found (0 high, 8 medium, 5 low). Top priorities: unreadable stored data shown as "no entries" (#7, shared hook), two diverging classification rules (#1), stale session counts and a frozen "today" on the home screen (#4, #5), and the missing freshness cue (#6). The audit was made by reading code, without a browser run.

## Impact
`proto-harden` will implement the priority list. Re-run `proto-edgecases` after the prototype changes to get a fresh baseline.
