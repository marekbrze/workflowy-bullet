# Domain Glossary

Terms and concepts specific to this project. Used across all project skills to maintain a consistent language. The whole project — code, UI, docs — is English; the interview is in the designer's language.

| Term (original, from interview) | Code Name | Definition | Avoid saying |
|---|---|---|---|
| bullet / wpis | `Entry` | A single WorkFlowy node that belongs to a given day — either a child of the day node or a bullet dated that day anywhere in the tree. The unit being processed. | "item", "node" (in UI), "todo" |
| bullet z datą | `DatedBullet` | A WorkFlowy bullet carrying a date, located anywhere in the tree; one of the two sources of a day's entries. | "calendar item" |
| węzeł dnia / dzień w kalendarzu | `DayNode` | The WorkFlowy calendar node representing a specific date; its children are that day's entries. | "day page", "daily note" |
| dzień | `Day` | A date plus all its entries (children of its `DayNode` + `DatedBullet`s with that date). Can be open or closed. | — |
| zadanie | `Task` | An entry that is something to do. Must end up done, rolled over, or irrelevant. | "todo", "action" |
| notatka | `Note` | An entry that records information from the day. Stays in the day, optionally mirrored elsewhere. | "memo", "log" |
| zdarzenie | `Event` | An entry recording something that happened / took place on that day. Only tagged; stays as a record. | "appointment", "meeting" (too narrow) |
| typ / tag | `EntryType` | The Bullet Journal classification of an entry (task, note, event), persisted as a tag in WorkFlowy. Assigned by the app based on the user's decision. | "category", "label" |
| procesowanie dnia | `DayReview` | The act of going through a day's entries one at a time and deciding on each. The morning review of yesterday is the main ritual. | "cleanup", "triage" (in UI) |
| kolejka | `ReviewQueue` | The ordered set of a day's unprocessed entries, shown one at a time. | "list" |
| rollowanie / migracja zadania | `RollOver` | Moving an unfinished task forward: the original is completed and tagged as migrated in its day, and a copy is created in today's day node. Targets today — except in a `today` session, where it targets tomorrow. | "postpone", "snooze", "move" |
| zmigrowane zadanie | `MigratedTask` | The original of a rolled-over task — completed and tagged as migrated, kept in its day as history. | "deleted task", "moved task" |
| nieaktualne (irrelevant) | `Irrelevant` | Task decision: no longer worth doing. The task is completed and tagged `#irrelevant`. | "cancelled", "deleted" |
| mirror notatki | `NoteMirror` | A WorkFlowy mirror of a note created in a destination node chosen by the user via search; the note itself stays in its day. | "copy", "link", "move" |
| miejsce docelowe | `Destination` | A WorkFlowy node where a note is mirrored to. Found via search. | "folder", "project" |
| zamknięty dzień | `ClosedDay` (derived: `isClosed`) | A day in which every entry has a type and no task is left open. Computed, not stored. | "archived day", "done day" |
| zaległe dni | `Backlog` | All past days that are not closed. Processed oldest first; their tasks roll straight to today. | "history", "overdue" |
| dziś | `Today` | The current date's day node — the only target for rolled-over tasks (for now). | — |
| sesja przetwarzania | `ReviewSession` | (Called a "review" in the interface.) A resumable run through a queue of entries, one at a time, in one of three modes (`today`, `yesterday`, `backlog`). Lasts until the user ends it, possibly across many days; its undo history is discarded on end. | "batch", "run" (in UI) |
| decyzja | `Decision` | One recorded processing step in a session, stored so it can be undone. | "action log" |
| cofnij | `Undo` | Reverting a decision within the active session, step by step. Not available for Delete. | "rollback" |
| usuń wpis | `Delete` | Permanently removing an entry that should never have existed (junk, duplicate). Confirmed, not undoable. Distinct from `Irrelevant`. | "irrelevant", "archive" |
| zostaw otwarte | `LeaveOpen` | Task decision available only in a `today` session: keep the task open, still being worked on. | "skip", "postpone" |
| lista dziś | `TodayList` | A plain list of today's entries with quick typing; the entry point to a `today` session. | "dashboard", "inbox" |
| ostatnie / przypięte miejsca | `SavedDestination` | A remembered destination: `recent` (automatic) or `pinned` (favorite). | "bookmark", "shortcut" |
| snapshot drzewa | `TreeSnapshot` | Local cache of the whole WorkFlowy tree (`/nodes-export`), used to find dated bullets and search destinations, since the API has no search. | "index", "database" |
| połączenie | `Connection` | The WorkFlowy API key stored locally. | "login", "account" |
