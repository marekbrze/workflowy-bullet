# Action Inventory

Complete list of actions users can perform, organized by entity.

## Roles
- **Owner**: The single user of this personal tool — owner of the WorkFlowy account. Can do everything.

## Actions

### Connection

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| Connect WorkFlowy | Enter the API key so the app can read and write WorkFlowy | Owner | Stored locally |
| Change API key | Replace the stored key | Owner | Verified before replacing. A key from a different account asks for confirmation and clears the old account's local data |
| Disconnect | Remove the stored key and the tree snapshot | Owner | Confirmed. Entries, active sessions and saved destinations stay stored locally for a later reconnect, unless "Also remove my local data" is ticked |

### TreeSnapshot

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| Refresh snapshot | Re-download the whole tree to pick up new dated bullets and destinations | Owner | Also automatic; limited to 1 request/minute by the API |

### Day

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| View Today list | See today's entries as a plain list | Owner | |
| View Backlog | See the queue of open days older than yesterday, oldest first | Owner | Everything since the calendar began |
| View day status | See whether a day is open or closed and what's left in it | Owner | `isClosed` is derived |

### ReviewSession

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| Start today session | Start processing today's entries one at a time, from the Today list | Owner | Mode `today` |
| Start yesterday review | Start the morning review of yesterday | Owner | Mode `yesterday` |
| Start backlog session | Start working through open past days, oldest first | Owner | Mode `backlog` |
| Resume session | Continue an active session at the first unprocessed entry, even after days or app restarts | Owner | Max one active session per mode |
| Skip to next entry | Send the current entry to the end of the queue without deciding | Owner | The entry returns after the rest; a day cannot close while a skipped entry is unprocessed |
| End session | Finish the session; its undo history is discarded | Owner | |

### Entry

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| Classify entry | Mark an untyped entry as task, note, or event; the app writes `#task` / `#note` / `#event` | Owner | Only entries needing a decision enter the queue |
| Change type | Correct an existing type, including one tagged manually in WorkFlowy | Owner | On a task's card (key G); undoable |
| Quick-type from Today list | Classify or correct an entry directly from the Today list, outside a session | Owner | Same rule as the session card; a quiet Change on typed rows |
| Delete entry | Permanently delete an entry that should never have existed (junk, duplicate) | Owner | Any type, including untyped. Requires confirmation. **Cannot be undone.** Distinct from Irrelevant |

### Task (Entry of type task)

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| Mark done | Complete the task in WorkFlowy | Owner | No extra tag |
| Roll over to today | Complete the original + tag `#migrated` in its day; create an independent copy (with children) in today's day node | Owner | Modes `yesterday`, `backlog`. Copy has no link or roll counter |
| Roll over to tomorrow | Same as above, but the copy goes to tomorrow's day node | Owner | Mode `today` only |
| Mark irrelevant | Complete the task + tag `#irrelevant`; it stays in the day as history | Owner | |
| Leave open | Keep today's task open — still being worked on | Owner | Mode `today` only |

### Note (Entry of type note)

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| Keep in day | Leave the note where it is | Owner | |
| Mirror to destination | Create a WorkFlowy mirror of the note under a chosen destination | Owner | Max one mirror per note (choosing another place moves it). Offered at classification, and from the Today list (File… / Move…) |

### Event (Entry of type event)

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| Keep as record | Event is only tagged and stays in the day | Owner | No further decision |

### Destination

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| Search destination | Find a WorkFlowy node by text in the tree snapshot | Owner | |
| Pick recent destination | Choose from the automatic list of recently used destinations | Owner | |
| Pick pinned destination | Choose from pinned favorites | Owner | |

### SavedDestination

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| Pin destination | Add a destination to favorites | Owner | Star, or Shift+Enter on the highlighted row |
| Unpin destination | Remove a destination from favorites | Owner | |

### Decision

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| Undo decision | Revert the last decision, step by step back to the start of the session (uncomplete, remove tags, delete roll-over copy, remove mirror) | Owner | Works across days and restarts until the session ends. Delete cannot be undone |
