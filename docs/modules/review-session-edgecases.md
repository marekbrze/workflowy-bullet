# review-session — Edge Cases

Audit of the lo-fi prototype in `src/modules/review-session/` against `docs/modules/review-session.md`. Findings come from reading the code and from the logic checks run during `proto-lofi`; no browser run was possible in the audit environment, so nothing here was observed on screen.

## Coverage
- **Spec already captured** (Edge Cases section): write to WorkFlowy fails · empty queue at start · entry with many children · skipped entries · undo after a roll-over · session left for days (stale queue) · invalid API key mid-session.
- **Already handled in code**:
  - Empty queue at start → "Nothing to review" screen (`ReviewSessionPage.tsx:94-111`).
  - Many children → collapsed `<details>` (`EntryCard.tsx:36`).
  - Skipped entries → go to the end of the queue and keep the summary unreachable (`session-logic.ts` `skip`).
  - Undo after a roll-over → copy deleted, original restored (`session-logic.ts:164-176`).
  - Invalid key mid-session → session paused, notice shown (`ReviewSessionPage.tsx:32-34`).
  - Write failure → `WriteErrorNotice` with "Try again" (`use-review-session.ts:78-81`), **but only reachable through the dev-only simulation switch** — see #1.
- **Spec-flagged but not handled**: stale queue (#3).
- **New gaps found**: 16
- **By severity**: 🔴 3 · 🟡 7 · 🟢 6

## Hardening status
`proto-harden` closed **14 of 16** gaps (✅). Two are deferred (❌) with reasons: #9 and #15. Status column below; **Now at** shows where each fix lives. Run-time behavior was verified through logic checks (queue, undo, change type, resume, storage write result) and lint/typecheck/build — not in a browser.

## Inventory

| # | Severity | Category | Edge case | Behavior before hardening | Suggested behavior | Where (and now) |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 ✅ | 🔴 | Prototype-specific | LocalStorage write fails (quota, private mode) | `setValue` updates React state *before* writing, then only `console.error`s. The decision looks applied but is lost on reload. `run`'s `catch` never fires for a real storage failure, so the error UI is unreachable. A decision writes two keys (`entries`, `review-sessions`); if the second write fails the entry changed but the queue did not (half-applied). | Make `useLocalStorage` report failure (return/throw) and write before updating state; apply a decision to both keys atomically or not at all; route failure into the existing error state. | `src/shared/hooks/use-local-storage.ts:16-21`, `use-review-session.ts:68-75,78`  **Now:** `shared/hooks/use-local-storage.ts:39` (write first, returns `false`, app banner via `shared/components/StorageFailureBanner.tsx:6`); `use-review-session.ts:80,96` (atomic two-key write with rollback, failure → error state) |
| 2 ✅ | 🔴 | State transitions | Entry typed as **event** (or note) elsewhere while it sits in an active session queue | `getStep` returns `'task'` for anything that is neither untyped nor a note, so a quick-typed event shows "What happens to this task?" and *Done* sets `outcome: 'done'` on an event. | Drop entries from the queue when they no longer need a decision (event, typed note already mirrored, completed task); make `getStep` exhaustive. | `session-logic.ts:34-38`, quick-type in `days/lib/days.ts` `quickType`  **Now:** `session-logic.ts:35,46` — `getStep` is exhaustive, `reconcileQueue` drops entries that no longer need a decision |
| 3 ✅ | 🔴 | Cross-module & lifecycle | Queue head no longer exists in `entries` (entry deleted/changed in WorkFlowy or another tab, scenario reload) | `currentEntry` becomes `null`, so the page renders **"Queue finished"** even though `queue` still holds entries. "Done" then ends the session and the remaining entries are silently dropped from it. | Prune ids that no longer resolve (or re-sync the queue with current entries) on load; only show the summary when the queue is actually empty. | `use-review-session.ts:85-86`, `ReviewSessionPage.tsx:121,149-158`  **Now:** `session-logic.ts:46` + derived queue in `use-review-session.ts`; summary only when the real queue is empty |
| 4 ✅ | 🟡 | State transitions | Completed-but-untyped entry classified as task | `classify` always sets `outcome: 'open'` for a task, which would **re-open** an entry already completed in WorkFlowy. The model has no "completed" independent of the task outcome. | Spec decision needed: carry the WorkFlowy completed state on `Entry`; classify a completed entry as a done task (or skip the task step). | `session-logic.ts:78`, `types/entry.ts`  **Now:** `session-logic.ts:148` — a completed entry classified as task becomes done; `Entry.completed` added |
| 5 ✅ | 🟡 | Action outcomes | "Change type" is in the spec/ACTIONS but missing | A typed entry (e.g. tagged manually as `#task` but really a note) only offers task decisions — no way to correct the type from the card. | Add a quiet "Change type" control on the card (and a key) that returns the entry to the classify step. | `DecisionBar.tsx:26-41`, `docs/ACTIONS.md:48`  **Now:** `ReviewSessionPage.tsx:84` (retype flow, key **G**), `SessionToolbar.tsx` (Change type button) |
| 6 ✅ | 🟡 | Errors | Write-failure recovery is loose | While the error shows, hotkeys are off but the toolbar buttons (Skip/Undo/Delete) stay clickable, and "Try again" replays the stale transition (captured `currentId`) against whatever is now current. For a note, the picker *closes* (spec: stays open) and the destination is already saved as **recent** before the write succeeded. `dismissError` exists but is unused. | Disable the card while an error is pending; keep the picker open on failure; record "recent" only after a successful mirror; offer dismiss. | `ReviewSessionPage.tsx:74,141-147,163-164`, `DestinationPicker.tsx:64-67`, `use-review-session.ts:79,105-111`  **Now:** `ReviewSessionPage.tsx:190,221,228` (toolbar and bar locked; picker stays open with the error), `DestinationPicker.tsx:75` (recent only after success), `use-review-session.ts:113` (retry uses latest state), dismiss wired |
| 7 ✅ | 🟡 | Loading & async | Session scope is frozen at start; "today" is computed once | New entries added after the session started never join the queue (summary can say "Queue finished" while the Today list still shows waiting entries). A `yesterday` session resumed days later still says "Yesterday review" for older entries. `today` is memoized, so a tab left open past midnight rolls tasks to the wrong day. | Decide resume semantics: show a "N new entries" prompt, or rebuild the queue on resume; recompute `today` on resume/focus. | `ReviewSessionPage.tsx:46-48`, `use-review-session.ts:38`, `days/hooks/use-days.ts:11`  **Now:** `use-review-session.ts:117` + `ReviewSessionPage.tsx:70` — new entries are added once per resume with a one-line note. Partial: `today` is recomputed on each visit, not while a tab stays open past midnight |
| 8 ✅ | 🟡 | Cross-module & lifecycle | Undo of a roll-over after the copy was processed | Undo deletes the copy (`createdEntryId`) even if it was meanwhile completed or rolled again in another session, losing that work and orphaning any further copy. | Block undo (or warn) when the created copy has changed since. | `session-logic.ts:170-172`  **Now:** `session-logic.ts:103`, guard at `use-review-session.ts:164` — undo is blocked with an explanation |
| 9 ❌ | 🟡 | Action outcomes | No in-flight state for a real WorkFlowy write | Decisions apply synchronously. With a real API the buttons stay enabled during the request, allowing double submits, and nothing shows progress. | Disable the decision controls while a write is pending; show a calm in-flight indicator. | `DecisionBar.tsx:49-54`, `SessionToolbar.tsx:15-27`  **Now:** Deferred: decisions are synchronous in the prototype, so there is nothing in flight to show. Revisit when the real WorkFlowy API is wired in |
| 10 ✅ | 🟡 | Prototype-specific | Two tabs/windows | Each hook instance holds its own copy and writes whole arrays; the last writer silently overwrites the other's decisions. | Listen to `storage` events and reload state, or warn about a second open tab. | `use-local-storage.ts:18`  **Now:** `use-local-storage.ts:26` — listens to `storage` events and reloads the changed key |
| 11 ✅ | 🟢 | Forms & input | Hotkeys keyed by character, not physical key | Home-row positions (A S D F J K L) shift on Colemak/Dvorak, which defeats the "home row" intent. | Match on `event.code` (`KeyA`…) for the positional shortcuts. | `use-hotkeys.ts:16`  **Now:** `use-hotkeys.ts:4` — shortcuts match the physical key (`event.code`) |
| 12 ✅ | 🟢 | Data states | Very long unbroken text (URL); duplicate child text | `whitespace-pre-wrap` without `break-words` can overflow the card; `key={child}` collides for two identical sub-items. | Wrap long words; key children by index. | `EntryCard.tsx:33,40`  **Now:** `EntryCard.tsx:33` (`break-words`, index keys) |
| 13 ✅ | 🟢 | Navigation & flow | Invalid mode in the URL | Silently redirects to Today with no message. | Redirect with a short notice, or show a not-found state. | `ReviewSessionPage.tsx:29`  **Now:** `ReviewSessionPage.tsx:40` — an unknown review shows a clear message instead of redirecting |
| 14 ✅ | 🟢 | Action outcomes | Undo does not say what it will undo | Plain "Undo" button; after the card swaps instantly there is no cue what was last decided. | Tooltip/label such as "Undo: marked done". | `SessionToolbar.tsx:18-19`  **Now:** `SessionToolbar.tsx:41` + `session-logic.ts:95` — Undo names what it reverts (title and accessible name) |
| 15 ❌ | 🟢 | Data states | Rich WorkFlowy text (links, bold, inline tags/dates, mentions) | Entry text renders as plain text only; the spec is silent on formatting. | Spec decision, then render links/inline tags or strip them consistently. | `EntryCard.tsx:33`  **Now:** Deferred: needs a spec decision first (how links, bold, inline tags and mentions from WorkFlowy should look); the real API shape is not known yet |
| 16 ✅ | 🟢 | Loading & async | No skeleton on first render | Between mount and `start()` the page renders `null` for a frame; a slow real tree load would show nothing. | Skeleton matching the card layout. | `ReviewSessionPage.tsx:113`  **Now:** `ReviewSessionPage.tsx:157` + `EntryCardSkeleton.tsx` — skeleton instead of a blank frame (and an error + retry if the first save fails) |

Checked with no issues found: special characters/emoji in text (rendered as text nodes, no HTML injection); one record vs many (queue is an id array, counter stays correct); empty-queue start; resume after reload (session and picker state are restored); deep-link refresh of `/review-session/:mode` (session persists, Pages serves `404.html`); offline behavior of the prototype (everything is local).

## Priority list
1. **Storage failure is silent (#1)** — a decision can vanish or half-apply with no sign; it also makes the designed error state unreachable outside the simulation switch.
2. **Wrong card for an entry typed elsewhere (#2)** — corrupts an event into a "done task".
3. **False "Queue finished" with entries left (#3)** — drops real entries from the session.
4. **Resume semantics (#7)** — decide what a long-lived session means (new entries, which day it is) before more flows depend on it.
5. **Completed-untyped and Change type (#4, #5)** — two spec/model gaps that shape the Entry type; settle them before hi-fi.
6. **Write-failure recovery (#6) and in-flight state (#9)** — turn the happy-path error notice into a safe flow.
7. Cross-tab and undo edges (#8, #10), then polish (#11–#16).

## Hand-off to proto-harden (done)
Implement first:
- Make storage writes fail loudly and atomically (#1), then wire real failures into the existing error state.
- Reconcile the queue with current entries on load and after every transition (#2, #3).
- Tighten the error flow: block the card while an error is pending, keep the picker open, record "recent" after success (#6).
- Designer decisions needed: resume semantics (#7), completed-untyped entries (#4), and whether to add Change type now (#5).

## After hardening — left for later
- #9 in-flight state — when the real API replaces LocalStorage.
- #15 rich WorkFlowy text — needs a spec decision.
- Re-run `proto-edgecases` for a fresh baseline; the new flows (Change type, resume with new entries, blocked undo) have not been stress-tested yet.
