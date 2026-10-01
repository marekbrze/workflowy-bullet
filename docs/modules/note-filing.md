# note-filing

## Vision
A fast, quiet detour inside the review flow: the user has just classified a note and wants it to also live somewhere sensible in the WorkFlowy tree. One search field, the places they use most already waiting underneath, one keystroke to confirm — and they are back in the queue. It must never break the one-entry-at-a-time rhythm: typing starts immediately, no extra confirmation, and a wrong choice is fixed with Undo.

The note itself always stays in its day; filing only adds a mirror under the chosen destination.

## User Flows

### File a note (mirror to a destination)
1. User classifies an entry as a note in `review-session` → the destination picker opens over the card.
2. The search field has focus. With an empty field the user sees **pinned** places, then **recent** places.
3. The user types → results from the tree snapshot replace the lists. Each result shows the node name (match highlighted), its path in the tree, and its number of children.
4. The user picks a result with the arrows and presses Enter (or clicks) → the mirror is created under that destination.
5. The destination is added to **recent** (most recent first, max 5; pinned places are not counted). The next entry appears immediately; Undo stays available.

### Keep the note in its day
1. In the picker the user chooses "Keep in day" (or presses Esc) → no mirror is created.
2. The next entry appears.

### Pin / unpin a destination
1. Every destination row (search result, recent, pinned) has a star.
2. One click on the star pins or unpins it in place — there is no separate management screen.

### Nothing found / stale snapshot
1. The search returns nothing → plain message "No matches" with two options: refresh the tree snapshot, or keep the note in its day.
2. Refreshing is limited by the API to once per minute; if the limit blocks it, the message says when it can be tried again.

### Undo a mirror
1. In `review-session` the user presses Undo → the mirror is removed from the destination (via `DELETE /nodes/:id/mirror`) and the note card is shown again.

## Screens (rough)

- **Destination picker**: opens over the entry card. Search field on top (focused). Below it: with an empty field, a **Pinned** list and a **Recent** list; with text, search results. Each row: name, path, child count, star. A "Keep in day" action is always available. Footer shows the keys (arrows, Enter, Esc).
- **No-results state**: message, "Refresh tree" and "Keep in day".
- **Write error state**: the picker stays open with a plain message and "Try again"; no mirror is considered created until the write succeeds.

## Actions

| Action | Description | Entity | Notes |
|--------|------------|--------|-------|
| Search destination | Find a node by text in the tree snapshot | Destination | Starts as soon as the user types |
| Pick pinned destination | Choose from favorites | SavedDestination | Shown when the search field is empty |
| Pick recent destination | Choose from the last 5 used | SavedDestination | Max 5; pinned are not counted |
| Pin destination | Star a destination | SavedDestination | Star on any row |
| Unpin destination | Remove the star | SavedDestination | Star on any row |
| Mirror to destination | Create the mirror under the chosen node | NoteMirror | Selecting a place is the confirmation; max one mirror per note |
| Keep in day | Skip mirroring | Entry | Esc or explicit action |

## Edge Cases

- **No results**: message with "Refresh tree" and "Keep in day".
- **Stale snapshot**: a destination may no longer exist in WorkFlowy; if the write fails the picker shows the error and stays open.
- **Refresh blocked by the rate limit**: the message states when a refresh is possible again.
- **Same node name in many places**: the path in each row is what tells them apart.
- **Note already has a mirror**: at most one mirror per note — to be examined in `proto-edgecases` (e.g. on undo/redo of the decision).
- **Pinned destination deleted in WorkFlowy**: the pinned row may point to nothing — to be examined in `proto-edgecases`.
- **Empty pinned and recent lists** (first use): the picker shows only the search field and a short hint.

## Integration Points

- **review-session**: opens the picker when a note is classified; receives either the chosen destination (mirror created) or "keep in day", then continues the queue. Undo of this decision removes the mirror.
- **connection**: the tree snapshot is the data source for search; refreshing it is limited to once per minute.
