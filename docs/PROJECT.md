# Untitled (working name: workflowy-bullet)

## Core Idea
A layer on top of WorkFlowy's calendar (connected via the WorkFlowy API) that lets the user process each day by Bullet Journal rules: every dated bullet is classified as a task, note, or event, and handled one at a time in a guided queue — tasks get completed or rolled over to today, notes can be mirrored to their proper place in the tree. The app writes the resulting tags and completion states back to WorkFlowy, so the user never has to do the migration by hand.

## User Problems
- **Capture without migration**: the user creates a lot of entries in WorkFlowy every day, but lacks the energy/motivation/time to migrate them afterwards. Unfinished tasks get lost in past days, notes stay buried in the day they were written, and days are never "closed". Today there is no workaround — the migration simply doesn't happen.
- **Backlog of unprocessed days**: because migration hasn't been happening, there is a long tail of past days that are still open (untyped entries, unfinished tasks). Closing them manually feels overwhelming.
- **Deciding what to do with each item is draining**: looking at a whole day's list at once is paralyzing. The user has already found (in their own apps *dopadone* and *autowork*) that processing items **one after another**, with a small fixed set of decisions per item, is what actually gets them through.

## Target Users
The project's author — **a personal, single-user tool**. A heavy WorkFlowy user who captures everything into WorkFlowy's calendar during the day and wants a Bullet Journal–style review ritual on top of it.

**Design persona** (carried over from *autowork*): someone easily overwhelmed (ADHD-leaning), who needs to be led through an imposed, one-way funnel — one item at a time, few decisions, nudge rather than force — instead of being handed another list to manage. Tone (carried over from *dopadone*): calm, warm, no gamification, no manufactured urgency.

## Key Actions
1. **Morning review of yesterday** — process yesterday's entries one by one until the day is closed.
2. **Classify an entry** — mark it as a task, a note, or an event (the app writes the tag to WorkFlowy).
3. **Decide a task's fate** — done, roll over to today, or irrelevant.
4. **File a note** — leave it in the day, or mirror it to a place in the WorkFlowy tree chosen via search.
5. **Close the backlog** — see the list of past days that are still open and process them, oldest first.

## Happy Path
1. In the morning the user opens the app. It connects to WorkFlowy via the API.
2. The app gathers yesterday's entries from two sources: the children of yesterday's **day node** in the WorkFlowy calendar, and **bullets dated** yesterday living anywhere in the tree.
3. Entries are shown **one at a time**, as a queue.
4. For each entry:
   - If it has no type yet, the user classifies it: **task**, **note**, or **event**. The app writes the tag.
   - **Task**:
     - **Done** → completed in WorkFlowy.
     - **Roll over** → the original is marked completed + tagged as migrated in yesterday; a **copy** is created in **today's day node**.
     - **Irrelevant** → completed + tagged `#irrelevant`.
   - **Note**: stays in the day, or the user searches the WorkFlowy tree for a destination and the app creates a **mirror** there.
   - **Event**: just tagged; it stays in the day as a record.
5. When every entry is typed and no task is left open, the day is **closed**. The app moves on (or shows the day as done).
6. **Backlog mode**: the app lists every past day that is not closed. The user processes them oldest first, same flow — tasks from old days roll straight to **today**, not to the day after them.

Entries can also be typed during the day (not only in the morning review); the morning review is the main ritual.

## Rules
- **A day is closed** when every entry in it has a type tag and no task in it is still open (not completed). Only notes, events, and completed tasks remain. "Closed" is derived, not stored as a tag.
- **Rolling over always targets today's day node**, regardless of which past day is being processed.
- **A rolled task's original is completed**, never deleted — the history of the day is kept, as in a paper Bullet Journal.
- **The app assigns tags** based on the user's processing decisions; the user doesn't have to type them in WorkFlowy.
- **Scope for now: today only** — no scheduling tasks to a specific future date.

## Open Questions
- **Exact tag names** — e.g. `#task` / `#note` / `#event` / `#migrated` / `#irrelevant`? English, short, one convention? Does a done task get an extra tag, or is WorkFlowy's completed state enough?
- **Roll-over count** — should the app track (and show) how many times a task has been rolled over, as a "maybe this isn't important" signal? Should the copy link back to the original?
- **Copy vs mirror for rolled tasks** — the user chose a copy; confirm that the copy is independent (not a WorkFlowy mirror) and what it carries over (children? notes? other tags?).
- **What if today's day node doesn't exist yet** — should the app create it?
- **Note destinations** — the user still has to organize target places in WorkFlowy. Should the app offer recent/favorite destinations in addition to search?
- **Where the in-day tagging happens** — in the app, directly in WorkFlowy, or both? Should the app respect type tags the user typed manually in WorkFlowy?
- **WorkFlowy API capabilities** — needs verification: querying bullets by date, reading the calendar day nodes, creating mirrors, completing nodes, search. This may constrain the design.
- **Auth, hosting, and data** — API key storage, local-only vs hosted, whether the app keeps any local state (e.g. progress through a queue) or reads everything live from WorkFlowy.
- **Undo** — can a decision be reverted (e.g. an accidental roll-over) within the review?
- **Events** — do past events need any decision beyond tagging (e.g. follow-up notes)?
- **App name** — working name only.
