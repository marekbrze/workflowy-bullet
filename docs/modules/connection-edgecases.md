# connection — Edge Cases

Audit of the lo-fi prototype in `src/modules/connection/` against `docs/modules/connection.md`. Findings come from reading the code and from the logic checks run during `proto-lofi`; no browser run was possible in the audit environment, so nothing here was observed on screen.

## Coverage
- **Spec already captured** (Edge Cases section): key rejected on first connect · network failure during connect or refresh · rate limit hit on manual refresh · very large tree · key becomes invalid mid-session · reconnecting with a different WorkFlowy account · local storage unavailable.
- **Already handled in code**:
  - Key rejected → the field stays filled and a plain message is shown, nothing is stored (`ConnectForm.tsx:33-36`, `connection.ts:11-25`).
  - Network failure during connect → a plain message; the previous connection is kept (`connection.ts:15-17`, `use-connection.ts:30-31`).
  - Rate limit on manual refresh → a message with the seconds left (`use-tree-snapshot.ts:28-34`, `SnapshotStatus.tsx:12-19`).
  - Downloading a large tree → a distinct "Downloading your WorkFlowy tree…" state (`ConnectForm.tsx:16-19,61-65`).
  - Key invalid mid-session → the session is paused, the notice leads to the fix, the form opens straight away (`ConnectionSettings.tsx:15-17`, review-session and days gate on `status`).
  - Double submit → the form ignores a second submit and disables the button while busy (`ConnectForm.tsx:27,31,67`).
  - Disconnect → confirmation; the key and snapshot are removed, sessions and saved places stay (`ConnectionSettings.tsx:83-95`, `use-connection.ts:47-51`).
  - Another tab connecting or disconnecting → this tab follows via the shared `storage` listener.
- **Spec-flagged but not handled**: reconnecting with a different account (#4), local storage unavailable (#1).
- **New gaps found**: 16
- **By severity**: 🔴 1 · 🟡 9 · 🟢 6

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🔴 | Prototype-specific | The key cannot be stored (storage full, blocked, private window) | `connect` ignores the result of its three writes and returns `{ ok: true }`, so the form closes as if connected while the key — or the tree — never reached storage; a reload then shows "Connect WorkFlowy" again. The writes are also not atomic: the tree can be saved without the key, or the key without the tree. | Check each write; save the key last and roll back the others on failure; return a clear error ("Couldn't save your connection in this browser") instead of success. | `use-connection.ts:35-38` |
| 2 | 🟡 | Prototype-specific | A real tree does not fit LocalStorage | The whole tree is stored as JSON under one key and re-parsed whenever a screen reads it. A real tree can have tens of thousands of nodes and exceed the browser's quota (which is what makes #1 likely). | Decide where a large snapshot lives (IndexedDB, or only an index) when the real API arrives. | `use-connection.ts:35`, `use-tree-snapshot.ts:23` |
| 3 | 🟡 | Action outcomes | A connect cannot be cancelled | Cancel is disabled while busy, so a slow download of a big tree cannot be abandoned. | Keep Cancel enabled and abort the request; leave the previous connection untouched. | `ConnectForm.tsx:71` |
| 4 | 🟡 | Cross-module & lifecycle | Reconnecting with a different WorkFlowy account | Nothing records which account a key belongs to, so a different account's tree replaces the old one while the stored entries, sessions and saved places from the old account stay and mix in. | Remember the account; on a change warn and offer to clear local entries, sessions and saved places. | `use-connection.ts:35-37`, `ConnectionSettings.tsx:42-46` |
| 5 | 🟡 | Cross-module & lifecycle | Disconnect leaves the entries behind | The confirmation says the key and tree are removed and sessions and saved places are kept — it does not say the stored entries (a copy of WorkFlowy content) also stay in this browser. | Say so in the dialog, and offer "Also remove my local data". | `ConnectionSettings.tsx:86`, `use-connection.ts:47-51` |
| 6 | 🟡 | Prototype-specific | The app shares its origin with other GitHub Pages sites | On `*.github.io` every project of the same account shares one origin, so the unprefixed keys (`connection`, `entries`, …) can collide with another project and the stored API key is readable by a sibling page. | Prefix every key with the app name; consider not persisting the key beyond need. (Shared hook — affects every module.) | `use-connection.ts:14`, `use-local-storage.ts` |
| 7 | 🟡 | Errors | A key that really stops working is not detected | `markInvalid` is called only by the dev-only button. When the real API answers "unauthorized", review-session and days show a generic "That didn't reach WorkFlowy" with Retry, never the invalid-key notice. | A typed auth error from the API layer that every module routes to `markInvalid`. | `use-connection.ts:53-55`, `use-review-session.ts` (generic `catch`) |
| 8 | 🟡 | Errors | Refreshing the snapshot has no failure path | `refresh()` can only succeed or hit the rate limit; a network failure is not modeled, so there is no message and no retry. | Add a failed result with a plain message and keep the old snapshot. | `use-tree-snapshot.ts:19,28-37` |
| 9 | 🟡 | Loading & async | The snapshot is never refreshed automatically | The spec says the snapshot is also refreshed in the background; no code does it, so a stale tree stays stale until the user presses Refresh. | Refresh in the background when the tab opens or regains focus and the snapshot is old (within the rate limit). | `use-tree-snapshot.ts` (no caller of `refresh` other than the buttons) |
| 10 | 🟡 | Forms & input | An empty key is only rejected after a server-style delay | Submitting an empty field shows "Checking your key…" for 600 ms before saying "Enter your API key" — a client-side check made to wait for the round trip. | Validate emptiness immediately and inline, without the checking state. | `ConnectForm.tsx:29-37`, `connection.ts:12-14` |
| 11 | 🟢 | Prototype-specific | Rate-limit message is static and Refresh stays enabled | "Try again in 42 s" does not count down and the button remains clickable. (The note picker's Refresh already counts down.) | One shared live countdown that disables the button. | `SnapshotStatus.tsx:12-19,30` |
| 12 | 🟢 | Forms & input | Pasted key with quotes or a "Bearer " prefix | Only surrounding whitespace is trimmed; quotes or a prefix are sent as part of the key and the user is told to check that they copied all of it. | Strip common wrappers before checking. | `connection.ts:13`, `use-connection.ts:37` |
| 13 | 🟢 | Forms & input | The pasted key can't be revealed | The field is a password input with no show toggle, so "check that you copied all of it" can't be done. | A "Show" toggle on the field. | `ConnectForm.tsx:46` |
| 14 | 🟢 | Data states | "Connected" with no sense of when | `connectedAt` is stored and exposed but never shown. | Show "Connected 3 days ago" next to the status. | `ConnectionSettings.tsx:27-30`, `use-connection.ts:44` |
| 15 | 🟢 | Prototype-specific | An unreadable stored connection looks like first run | If the `connection` value is damaged, the hook falls back to "no connection" and the user silently lands on "Connect WorkFlowy". | Use the hook's `unreadable` flag to say the saved connection could not be read. | `use-connection.ts:14`, `ConnectionPage.tsx:10-12` |
| 16 | 🟢 | Navigation & flow | Focus is lost after a successful connect | The form unmounts on success, leaving focus on the page body. | Move focus to the new heading or first control. | `ConnectForm.tsx:33-36`, `ConnectionPage.tsx:10-13` |

Checked with no issues found: special characters and emoji in the key (it is only masked and compared as text); double submit (guarded); a failed key check keeps the existing connection (the key is replaced only after verification and download); invalid key → "Change key" → connected again resumes an interrupted session; another tab changing the connection (the shared hook syncs it); back button and deep link (`/connection` renders from stored state); the dev-only "Simulate" button is hidden in production builds (`import.meta.env.DEV`); offline behavior of the prototype (the key check and download are mocked locally).

## Priority list
1. **Connect reports success without saving (#1)** — the one place where the app can say "connected" and be wrong; it also hides the most likely real failure (#2).
2. **Auth failures must reach the invalid-key flow (#7)** — otherwise the carefully built notice is unreachable in real use.
3. **Account and data lifecycle (#4, #5, #6)** — what stays, what leaks, and what is shared with other pages on the same origin.
4. **Refresh behavior (#8, #9, #11)** — a failure path, the automatic refresh the spec promised, and one consistent countdown.
5. **Connect form basics (#3, #10)** — cancel and instant validation.
6. Polish (#12–#16).

## Hand-off to proto-harden
Implement first:
- Make `connect` check every write, save the key last and roll back on failure (#1).
- Add a typed auth error and route it to `markInvalid` (#7); give refresh a failure result (#8).
- Prefix storage keys with the app name (#6), say what Disconnect leaves behind (#5).
- Designer decisions needed: whether switching accounts should clear local data (#4); whether Disconnect offers "also remove my local data" (#5); how automatic refresh should behave (#9); whether the key is persisted at all or only for the session (#6).
