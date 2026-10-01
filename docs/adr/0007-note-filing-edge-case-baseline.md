# 0007 - note-filing edge-case baseline

**Date**: 2026-10-01
**Module**: note-filing
**Status**: Accepted

## Context
The module's prototype handled happy paths but had not been stress-tested for edge cases.

## Decision
Audited into `docs/modules/note-filing-edgecases.md`. 16 gaps found (0 high, 9 medium, 7 low). Top priorities: the integrity cluster of stale saved places, a possible second mirror and nonsensical destinations (#1–#3), a way out of the picker without deciding (#5), and a keyboard pin shortcut (#6). The audit was made by reading code, without a browser run.

## Impact
`proto-harden` will implement the priority list. Re-run `proto-edgecases` after the prototype changes to get a fresh baseline.
