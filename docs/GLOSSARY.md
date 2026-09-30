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
| rollowanie / migracja zadania | `RollOver` | Moving an unfinished task forward: the original is completed and tagged as migrated in its day, and a copy is created in today's day node. Always targets today. | "postpone", "snooze", "move" |
| zmigrowane zadanie | `MigratedTask` | The original of a rolled-over task — completed and tagged as migrated, kept in its day as history. | "deleted task", "moved task" |
| nieaktualne (irrelevant) | `Irrelevant` | Task decision: no longer worth doing. The task is completed and tagged `#irrelevant`. | "cancelled", "deleted" |
| mirror notatki | `NoteMirror` | A WorkFlowy mirror of a note created in a destination node chosen by the user via search; the note itself stays in its day. | "copy", "link", "move" |
| miejsce docelowe | `Destination` | A WorkFlowy node where a note is mirrored to. Found via search. | "folder", "project" |
| zamknięty dzień | `ClosedDay` (derived: `isClosed`) | A day in which every entry has a type and no task is left open. Computed, not stored. | "archived day", "done day" |
| zaległe dni | `Backlog` | All past days that are not closed. Processed oldest first; their tasks roll straight to today. | "history", "overdue" |
| dziś | `Today` | The current date's day node — the only target for rolled-over tasks (for now). | — |
