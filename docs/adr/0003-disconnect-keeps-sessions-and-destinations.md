# 0003 - Disconnect keeps sessions and saved destinations

**Date**: 2026-10-01
**Module**: connection
**Status**: Accepted

## Context
While detailing `connection`, the designer was asked what should happen on Disconnect. `ACTIONS.md` only said "remove the stored key", which left open what happens to the tree snapshot, active sessions and saved destinations.

## Decision
Disconnect deletes the API key and the tree snapshot, after a confirmation. Active review sessions and saved destinations (pinned and recent) remain stored locally so they are available again after reconnecting.

## Impact
`ACTIONS.md` — "Disconnect" description updated. Reconnecting with a different WorkFlowy account may leave sessions and saved destinations pointing at nodes that no longer exist; flagged as an edge case for `proto-edgecases`.
