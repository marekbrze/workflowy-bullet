# days — Edge Cases

Audit of the lo-fi prototype in `src/modules/days/` (plus the shared storage hook and the connection pieces it renders) against `docs/modules/days.md`. Findings come from reading the code and from the logic checks run during `proto-lofi`; no browser run was possible in the audit environment, so nothing here was observed on screen.

## Coverage
- **Spec already captured** (Edge Cases section): nothing to process at all · yesterday has no entries · huge backlog · stale or refreshing snapshot · today's day node does not exist yet · several sessions active · disconnected or invalid key.
- **Already handled in code**:
  - Nothing to process → one quiet line (`HomePage.tsx:34-38`).
  - Yesterday has no entries → the card says "No entries" and offers no Start (`YesterdayCard.tsx:14,24-26`, `days.ts:26`).
  - Huge backlog → counter and one button, the list is collapsed (`BacklogBlock.tsx:25-45`).
  - Snapshot freshness → a status line with a rate-limited Refresh (`HomePage.tsx:58`, `SnapshotStatus.tsx`) — but see #6.
  - Today's day node missing → "Nothing captured today yet." (`TodayList.tsx:44-45`).
  - Several sessions → each block has its own Continue (`HomePage.tsx:19,42,48,54`).
  - Disconnected or invalid key → the home screen is replaced by the connect screen or the invalid-key notice (`HomePage.tsx:22-25`).
  - A failed quick-type write → the shared hook leaves state untouched and shows the app-wide banner (`use-days.ts:29-30`).
  - Another tab changing entries → the home screen follows via the `storage` listener (shared hook).
- **New gaps found**: 13
- **By severity**: 🔴 0 · 🟡 8 · 🟢 5

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🟡 | State transitions | Quick-typing a completed untyped entry as a task | `quickType` always sets `outcome: 'open'`, so a task already completed in WorkFlowy is re-opened. The same case was fixed for the session card (`classify`), but this is a second copy of the rule. | Reuse the session's classification rule so both paths agree (completed → done task, never re-opened). | `days.ts:32-36` vs `session-logic.ts` `classify` |
| 2 | 🟡 | Action outcomes | A mis-tap in quick-type cannot be corrected | Tapping Task / Note / Event writes the type at once and the row turns into a static label. There is no undo and no Change type on the list; the only correction is inside a session, and only for tasks. | A quiet "Change" on a typed row (or a short undo) that returns it to the three choices. | `TodayList.tsx:51-53` |
| 3 | 🟡 | Action outcomes | Notes typed from the list never get a filing step | A quick-typed note no longer needs a decision, so no later session offers a destination — unlike a note classified in a session. The spec does not say whether this is intended. | Spec decision: offer filing from the list ("File…"), or accept that quick-typed notes stay in their day. | `TodayList.tsx:54-66`, `days.ts:32-36` |
| 4 | 🟡 | Loading & async | Session counts on the home screen are raw | "N left in your review" uses the stored queue length, which can include entries since deleted or typed elsewhere, and excludes entries that arrived later; the Yesterday card also hides the real status of today's yesterday while a session is active. | Count from the reconciled queue plus any new entries, or show the real day status next to Continue. | `HomePage.tsx:19`, `YesterdayCard.tsx:24-26` |
| 5 | 🟡 | Loading & async | "Today" is frozen when the page loads | `today` is memoized once. The home screen is the page most likely to stay open overnight, so in the morning it still shows yesterday's date as Today and misses the new yesterday. | Recompute on window focus / visibility change and at midnight. | `use-days.ts:11` |
| 6 | 🟡 | Loading & async | Freshness is only a footnote | The spec asks the blocks to indicate when data may be out of date, but a tree refreshed days ago looks the same as a fresh one, and sessions are started from it. | Show a gentle "may be out of date" cue on the blocks once the snapshot is older than a threshold (designer picks it), with Refresh next to it. | `HomePage.tsx:58`, `SnapshotStatus.tsx:22` |
| 7 | 🟡 | Prototype-specific | Unreadable stored data looks like "no entries" | If the `entries` value cannot be parsed, the hook silently falls back to the empty default; the home screen says "No entries yet. Nothing to process." and the next successful write overwrites the damaged value. | Detect a parse failure, keep the raw value, and show a recovery message instead of treating it as empty. (Shared hook — affects every module.) | `use-local-storage.ts:18-21`, `HomePage.tsx:36` |
| 8 | 🟢 | Cross-module & lifecycle | Tasks rolled over to tomorrow disappear | After "Roll over to tomorrow" the copy is dated tomorrow, which no block shows; there is no cue where it went. | Spec decision: a quiet "Tomorrow" line, or a confirmation in the session. | `days.ts:17-22`, `HomePage.tsx:40-56` |
| 9 | 🟢 | Data states | Long text and long lists on Today | The entry text has no wrapping rule, so an unbroken string overflows; a day with hundreds of entries renders them all. | `break-words`; cap with "Show all" beyond a number the designer picks. | `TodayList.tsx:50,47-49` |
| 10 | 🟢 | Data states | Expanded backlog list is unbounded | "Show all open days" lists every day since the calendar began. | Limit the expanded list (e.g. the oldest 30) with a "show more". | `BacklogBlock.tsx:36-43` |
| 11 | 🟢 | Forms & input | Ambiguous button names | Screen readers read "Start" and "Continue" without their block. | Accessible names such as "Start yesterday review". | `YesterdayCard.tsx:28-30`, `BacklogBlock.tsx:30-32` |
| 12 | 🟢 | Loading & async | No loading state on first render | The screen reads LocalStorage synchronously, so there is nothing to show while data loads. With the real API the blocks would pop in. | Skeleton blocks matching the layout. | `HomePage.tsx:30-60` |
| 13 | 🟡 | Action outcomes | No in-flight state for quick-typing | The write is synchronous in the prototype. With the real API the three buttons stay enabled during the request. | Disable the row's buttons while its write is pending. (Same cause as review-session #9.) | `TodayList.tsx:56-64` |

Checked with no issues found: special characters and emoji in entry text (rendered as text nodes); empty collection and the all-clear state; one entry vs many (counts and lists scale); several active sessions; resume after reload (session state is read from storage); another tab changing data (the shared hook syncs it); back button and deep link (`/` is the root route and remounts with fresh state); offline behavior (everything is local); storage write failure while quick-typing (state is left untouched and the banner appears); permissions (single-user tool).

## Priority list
1. **Unreadable data (#7)** — the only case where the home screen can quietly lead to losing everything; it lives in the shared hook, so one fix helps every module.
2. **One classification rule (#1)** — two copies of "what does typing an entry as a task do" have already diverged; unify before adding more entry points.
3. **Honest counts and the right day (#4, #5)** — the home screen is the page that stays open and the one that tells the user what is waiting.
4. **Freshness cue (#6)** — the spec asked for it; today it is a footnote.
5. **Quick-type design (#2, #3)** — a correction path and a decision about notes.
6. Deferred with the real API (#13), then polish (#8–#12).

## Hand-off to proto-harden
Implement first:
- Make the storage hook report an unreadable value instead of returning the default (#7) and show a recovery message on the home screen.
- Route quick-typing through the session's classification rule (#1).
- Count sessions from the reconciled queue plus new entries (#4); recompute "today" on focus and at midnight (#5).
- Designer decisions needed: the staleness threshold and look of the freshness cue (#6); a "Change" control or undo for quick-typing (#2); whether quick-typed notes can be filed from the list (#3); whether a "Tomorrow" line is wanted (#8).
