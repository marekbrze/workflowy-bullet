# review-session

## Vision
The place where the user closes their days. A calm, one-way funnel: one entry on the screen, a small fixed set of decisions, then the next entry — never a list to manage. It must feel like a nudge, not a chore: no gamification, no manufactured urgency, no congratulations. Keyboard-first, so a whole day can be cleared in a minute or two without leaving the home row.

A session is resumable. The user can stop at any point — even for days, even after restarting the app — and come back to the first unprocessed entry. Every decision can be undone, step by step, until the session ends.

## User Flows

### Process a session (all modes)
1. User starts or resumes a session from `days` (Today list, yesterday review, or Backlog) → sees the first unprocessed entry as a card.
2. The card shows the entry text, its children (content that travels with it), the day it belongs to, a progress counter, and its current type/tags if it has any.
3. If the entry is untyped, the user classifies it (task / note / event) with a key. The tag is written to WorkFlowy.
4. Depending on the type:
   - **Task** → done / roll over / irrelevant (+ leave open in `today` mode).
   - **Note** → keep in day, or open `note-filing` to mirror it to a destination.
   - **Event** → no further decision; it stays in the day as a record.
5. The decision is applied to WorkFlowy and recorded. The next entry appears immediately; Undo stays available.
6. When the queue is empty, a quiet summary screen is shown.

### Resume after a break
1. User opens the app (minutes, days or a restart later) → sees a short "Continue" for the active session.
2. The session reopens at the first unprocessed entry. Undo history is still there.

### Undo
1. User presses Undo (button or key) → the last decision is reverted in WorkFlowy (uncomplete, remove tags, delete roll-over copy, remove mirror).
2. The card for that entry is shown again, ready for a new decision.
3. Repeatable, one step at a time, back to the start of the session. Delete is the one decision that cannot be undone.

### Skip
1. User skips an entry → it goes to the end of the queue and comes back after the rest.
2. The day cannot close while a skipped entry is unprocessed.

### Delete an entry
1. User presses Delete → a confirmation appears (this cannot be undone).
2. On confirm the entry is permanently removed from WorkFlowy and the next entry appears.

### End a session
1. The user ends the session explicitly (or reaches the end of the queue and confirms the summary).
2. The session's decision history is discarded.

## Screens (rough)

- **Entry card**: the main screen. Large entry text in the centre; children collapsed/expandable below it; a small header with the day and progress ("3 of 12"); current type/tags as quiet chips. Decision controls are shown only for the current step (classify first, then task/note outcome). Each control shows its keyboard shortcut. Undo is always visible but visually quiet.
- **Note destination picker**: opens over the card for a note (owned by `note-filing`).
- **Delete confirmation**: a small confirm dialog stating that the deletion is permanent.
- **Write error state**: the card stays in place, a plain-language message and a "Try again" button; nothing is treated as done until the write succeeds.
- **Session summary**: a calm end screen — the day is closed, how many entries were processed. No effects, no praise. One way out back to `days`.
- **Resume prompt**: a short "Continue" entry into an active session (shown where the session was started from, in `days`).

## Actions

| Action | Description | Entity | Notes |
|--------|------------|--------|-------|
| Start / resume / end session | Open, continue at the first unprocessed entry, or finish a session | ReviewSession | Max one active per mode; ending discards undo history |
| Skip to next entry | Send the current entry to the end of the queue | ReviewSession | Skipped entries return before the session can finish |
| Classify entry / Change type | Set or correct the entry type; app writes the tag | Entry | Types set manually in WorkFlowy are respected |
| Mark done | Complete the task | Entry | No extra tag |
| Roll over to today / tomorrow | Complete the original + `#migrated`, create an independent copy in the target day node | Entry | `yesterday`/`backlog` → today; `today` → tomorrow |
| Mark irrelevant | Complete the task + `#irrelevant` | Entry | |
| Leave open | Keep today's task open | Entry | `today` mode only |
| Keep in day / Mirror to destination | Note outcome | Entry | Mirroring is handled by `note-filing` |
| Keep as record | Event outcome | Entry | No further decision |
| Delete entry | Permanently remove the entry | Entry | Confirmed; not undoable |
| Undo decision | Revert the last decision | Decision | Step by step; not available for Delete |

## Edge Cases

- **A write to WorkFlowy fails** (network, rate limit): the session stops on the current card with a "Try again" button. The decision is not recorded and the entry is not considered processed.
- **Empty queue at start**: nothing to process — the summary/closed state is shown instead of an empty card.
- **Entry with many children**: the children are collapsed by default so the card stays calm; they expand on demand.
- **Skipped entries**: always return at the end; the day stays open until they are decided.
- **Undo after a roll-over**: the roll-over copy is deleted from the target day node and the original is uncompleted and untagged.
- **Session left for days**: the queue may be stale (entries changed in WorkFlowy meanwhile) — to be examined in `proto-edgecases`.
- **Invalid API key mid-session**: the session is interrupted by `connection` and can be resumed after fixing the key.

## Integration Points

- **days**: starts and resumes sessions in all three modes; shows the resume entry point; receives the user back after the summary.
- **note-filing**: opened from the card when a note is classified; returns the chosen destination (or "keep in day").
- **connection**: provides the live WorkFlowy access and the tree snapshot; an `invalid` key interrupts the session.
