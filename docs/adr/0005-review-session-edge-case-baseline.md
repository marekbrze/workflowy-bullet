# 0005 - review-session edge-case baseline

**Date**: 2026-10-01
**Module**: review-session
**Status**: Accepted

## Context
The module's prototype handled happy paths but had not been stress-tested for edge cases.

## Decision
Audited into `docs/modules/review-session-edgecases.md`. 16 gaps found (3 high, 7 medium, 6 low). Top priorities: silent LocalStorage write failure (#1), wrong card for an entry typed elsewhere (#2), false "Queue finished" when queue entries no longer exist (#3). The audit was made by reading code, without a browser run.

## Impact
`proto-harden` will implement the priority list. Re-run `proto-edgecases` after the prototype changes to get a fresh baseline.
