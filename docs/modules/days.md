# days

## Vision
The calm front door of the app. On opening it, the user sees everything that matters on one screen — yesterday waiting to be closed, today's entries, and a quiet note about older open days — and one obvious way to begin. No dashboards to manage, no red badges, no guilt about a long tail of open days: the app leads, the user follows.

## User Flows

### Open the app (home screen "Today")
1. User opens the app → sees one screen with three blocks: **Yesterday** (large card), **Today** (list), **Backlog** (quiet counter).
2. If a session is active, the relevant block shows "Continue" instead of "Start".
3. The user starts or continues from whichever block they choose; the app never forces an order.

### Morning review of yesterday
1. The Yesterday card shows its status in calm text ("3 entries waiting" or "Closed").
2. User presses "Start" → a `yesterday` session opens in `review-session` at the first entry.
3. If yesterday is already closed, the card says so and offers nothing to start.

### Work through the Backlog
1. The Backlog block shows a single counter ("47 open days") and one button: "Start with the oldest".
2. Pressing it starts a `backlog` session — oldest day first, tasks roll to today.
3. The full list of open days is available behind an expander, never shown by default.

### Today list and quick-typing
1. The Today block lists today's entries, each with a type chip when it already has one.
2. For an untyped entry, the user presses T / N / E (or clicks) to set the type directly — no session needed. The tag is written to WorkFlowy. A typed row has a quiet "Change" to correct the type, and a note row has "File…" (or "Move…") that opens the destination picker.
3. "Start today session" opens a `today` session over today's entries.

### Resume a session
1. The block belonging to an active session (Yesterday / Today / Backlog) shows "Continue" with a short note of where it stopped.
2. "Continue" reopens the session at the first unprocessed entry.

### Return after a session
1. After the session summary in `review-session` the user lands back on the home screen.
2. The affected blocks show their updated status.

## Screens (rough)

- **Home ("Today")**: a single vertical screen. Top: **Yesterday** card — date, calm status text, one primary button (Start / Continue). Middle: **Today** list — entries with type chips and quick-type keys, plus "Start today session". Bottom: **Backlog** — open-day counter and "Start with the oldest", expander for the full list.
- **Backlog list (expanded)**: open days oldest first; each row shows the date and the calm status ("3 entries waiting"). Read-only overview, with the oldest-first start button on top.
- **Empty / all clear state**: when there is nothing to process, a short quiet message instead of empty blocks.

## Actions

| Action | Description | Entity | Notes |
|--------|------------|--------|-------|
| View Today list | Today's entries as a plain list | Day | Entry point to the `today` session |
| Quick-type from Today list | Set or change T / N / E on an entry without a session | Entry | Writes the tag to WorkFlowy; same rule as the session card (a completed untyped entry becomes a done task) |
| File note from Today list | Mirror a note to a destination (or move its mirror) without a session | NoteMirror | Opens the destination picker |
| View day status | Calm text: how many entries are waiting, or "Closed" | Day | `isClosed` is derived |
| View Backlog | Counter of open days older than yesterday, full list on demand | Day | Oldest first, since the calendar began |
| Start today session | Open a `today` session | ReviewSession | Mode `today` |
| Start yesterday review | Open a `yesterday` session | ReviewSession | Mode `yesterday` |
| Start backlog session | Open a `backlog` session from the oldest open day | ReviewSession | Mode `backlog` |
| Resume session | Continue the active session of that mode | ReviewSession | Max one active session per mode |

## Edge Cases

- **Nothing to process at all**: yesterday closed, today empty, no backlog — one short calm message.
- **Yesterday has no entries / no day node**: the Yesterday card says there is nothing to review.
- **Huge backlog** (hundreds of open days): only the counter and the oldest-first start are shown; the list stays collapsed.
- **Tree snapshot stale or refreshing**: after an hour the status line reads "Your tree may be out of date" with Refresh next to it (calm, no alarm colors). While refreshing or rate-limited it says so.
- **Saved entries cannot be read**: the home screen says so instead of "No entries yet", explains that a copy was kept and offers "Start fresh".
- **A screen left open overnight**: "Today" and "Yesterday" update at midnight and when the tab regains focus.
- **Session counts** reflect what the session will really show (entries since deleted or settled are not counted, entries that arrived later are). A session with nothing left offers "Finish".
- **Tasks rolled over to tomorrow**: one quiet line under the Today list ("2 tasks waiting for tomorrow").
- **Many entries / many open days**: Today shows the first 20 entries and the expanded backlog the oldest 30 days, each with "Show all".
- **Today's day node does not exist yet**: the Today list is empty; creating it is left to WorkFlowy/the API when needed.
- **Several sessions active** (one per mode): each block shows its own "Continue".
- **Disconnected / invalid key**: no data can be shown — the home screen leads to `connection` instead.

## Integration Points

- **review-session**: receives the start/resume of a session in each mode; hands the user back to the home screen after the summary.
- **connection**: the tree snapshot is the source of days and entries; a missing or invalid connection replaces the home screen content with a prompt to connect.
