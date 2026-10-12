# How the app reads and writes WorkFlowy

## Reading
- **Snapshot**: `GET /nodes-export` (one request per minute, ~3 MB for ~8,500 bullets) plus `GET /nodes/calendar` for the calendar's id. Kept in memory and in IndexedDB (too big for LocalStorage). Refreshed when the app opens or the tab regains focus if older than an hour, or by hand.
- **Days**: bullets under the calendar whose whole name is one `<time startYear="…" startMonth="…" startDay="…">` element. A day's entries are its children.
- **Dated bullets**: any bullet outside the calendar whose name contains such a `<time>` element belongs to that date.
- **Entries kept**: yesterday, today, and every older entry that still needs a decision. Blank bullets are ignored. The derived list lives in LocalStorage (`entries`, ~0.6 MB for this tree).
- **Type and outcome** come from tags in the bullet's text: `#task`, `#note`, `#event`, `#archive` (kept for now, to be removed in bulk later); a completed task is `done`, `#migrated` or `#irrelevant`. Tags typed by hand in WorkFlowy are respected.
- **Account identity** is the calendar's node id.
- **Destinations**: every non-completed bullet outside the calendar with a non-empty name, with its path.

## Writing (each decision, in order)
| Decision | In WorkFlowy | Undo |
|---|---|---|
| Classify / change type | update the name: replace the type tag | restore the exact previous name |
| Classify a code block | never tagged: the user names it; a new code block holding the code is created as its first child, then the bullet itself is renamed (name + tag) and turned into a normal bullet — it keeps its place and id | the bullet becomes the code block again, the new child is deleted |
| Done | complete | uncomplete |
| Irrelevant | add `#irrelevant`, complete | restore name, uncomplete |
| Roll over | copy the bullet with all sub-items to the end of the target day (`YYYY-MM-DD`: tomorrow in a today review, else today), **then** add `#migrated` and complete the original; if that fails the copy is deleted again | restore name, uncomplete, delete the copy |
| Mirror | create the mirror (the old one is removed after); the app remembers the mirror's id locally | remove the mirror; a replaced mirror is re-created |
| Delete | delete the bullet and its subtree | not possible |
Copies keep each sub-item's layout (code blocks stay code blocks). Copies larger than 200 bullets are refused with a message. A decision is applied to WorkFlowy first and kept locally only if that worked; a failed save locally after a successful write is retried without repeating the write.

## Limits to know
- WorkFlowy's API does not say which bullets are mirrors, so only mirrors created by this app are known (kept in LocalStorage under `wfb:mirrors`).
- The name is inline HTML; the card shows plain text without the managed tags and `<time>` elements.
- After an overnight gap or a manual change in WorkFlowy, the next refresh re-derives the entries; the review queue drops entries that are gone or settled.
