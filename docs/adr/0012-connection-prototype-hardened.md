# 0012 - connection prototype hardened

**Date**: 2026-10-01
**Module**: connection
**Status**: Accepted

## Context
The module's prototype handled happy paths but not edge cases (see `docs/modules/connection-edgecases.md`). Four gaps needed a design decision: what happens when the key belongs to a different account, what Disconnect does with local entries, how to protect the key and data on GitHub Pages' shared origin, and when the snapshot refreshes on its own.

## Decision
Implemented 15 of 16 edge-case states: an all-or-nothing connection save with rollback (key last), cancel while connecting, account tracking with a confirmed switch, a Disconnect dialog that says what stays and can remove local data, namespaced storage keys with a one-time migration, an auth failure that reaches the invalid-key flow, a refresh failure path, automatic refresh, instant empty-key validation, key normalization and reveal, "connected N ago", an unreadable-connection message and focus management.
Designer decisions: (1) a key from a different account asks for confirmation and clears the old account's local data; (2) Disconnect keeps entries, sessions and saved places by default and offers "Also remove my local data"; (3) the app is for GitHub Pages with everything stored locally — keys are prefixed and the API key stays stored locally; (4) the snapshot refreshes when the app opens or the tab regains focus and it is over an hour old.
Deferred: where a real, large tree lives (#2) — it depends on the real API.

## Impact
`ConnectionRecord` gains `accountId`. Every LocalStorage key is now prefixed `wfb:` (`storageKey`, `readStorage`, `writeStorage`, `removeStored`, `clearAppStorage` in `shared/lib/storage.ts`); `migrateLegacyStorage` runs once at startup and `loadScenario` clears only this app's keys. `useLocalStorage` now also reloads when another hook in the same tab changes the key. `ACTIONS.md` — Change API key and Disconnect updated; `ENTITY_MAP.md` — Connection documents the account and the namespacing. `AuthError` / `reportAuthFailure` give every module one way to report an expired key. Visual polish remains a separate `proto-design` pass.
