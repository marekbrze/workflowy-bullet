# 0011 - connection edge-case baseline

**Date**: 2026-10-01
**Module**: connection
**Status**: Accepted

## Context
The module's prototype handled happy paths but had not been stress-tested for edge cases.

## Decision
Audited into `docs/modules/connection-edgecases.md`. 16 gaps found (1 high, 9 medium, 6 low). Top priorities: `connect` reporting success without saving (#1), real auth failures never reaching the invalid-key flow (#7), and the account and data lifecycle — account switch, what Disconnect leaves, storage keys shared with other GitHub Pages sites (#4, #5, #6). The audit was made by reading code, without a browser run.

## Impact
`proto-harden` will implement the priority list. Re-run `proto-edgecases` after the prototype changes to get a fresh baseline.
