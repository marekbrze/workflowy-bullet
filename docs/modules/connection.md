# connection

## Vision
Plumbing that stays out of the way. The user connects WorkFlowy once, with one short screen, and from then on the app simply works — the tree snapshot is kept up to date quietly in the background, and a one-line status says how fresh it is. When something breaks (a key that stops working), the app explains it calmly and leads straight to the fix without losing any progress.

## User Flows

### First connection
1. User opens the app for the first time → sees one screen: a short note on where to get the API key, one field, a "Connect" button.
2. User pastes the key and presses "Connect" → the app verifies the key against WorkFlowy.
3. On success the app downloads the tree snapshot and lands on the home screen of `days`.
4. On failure the field stays filled and a plain message explains what went wrong.

### Refresh the snapshot
1. A quiet status line shows how fresh the tree is, e.g. "Tree refreshed 12 min ago", with a "Refresh" button.
2. The app also refreshes the snapshot automatically in the background.
3. While refreshing the line says so; if the API rate limit (1 request per minute) blocks a manual refresh, the button is disabled and says when it can be used again.

### Key stops working (invalid)
1. A request fails because the key is no longer valid → the app shows a calm message ("WorkFlowy no longer accepts this key") and a "Change key" action.
2. Active sessions and local data are kept as they are; the user is not logged out of their progress.
3. After entering a working key the user returns to where they were — an interrupted session resumes at its current card.

### Change the API key
1. User opens the connection settings → "Change key" → pastes a new key → "Connect".
2. The key is verified and replaced; the snapshot is refreshed.

### Disconnect
1. User chooses "Disconnect" → a confirmation explains what will be removed.
2. On confirm, the API key and the tree snapshot are deleted. Entries, active sessions and saved destinations (pinned / recent) stay stored locally so they are available again after reconnecting — unless the user ticks "Also remove my local data", which removes those too.
3. The app returns to the first-connection screen.

## Screens (rough)

- **Connect screen** (first run and after disconnect): short explanation of where to find the API key, one field, a "Connect" button, inline error text.
- **Connection settings**: connection state (connected / invalid), "Change key", "Disconnect", the snapshot status line with "Refresh".
- **Snapshot status line**: a small piece of text shown on the home screen and in settings — fresh / stale / refreshing, with "Refresh" (disabled with an explanation while rate-limited).
- **Invalid key message**: calm full-screen or inline notice with "Change key"; appears wherever the failure occurs (including mid-session).
- **Disconnect confirmation**: small dialog stating what is removed and what is kept.

## Actions

| Action | Description | Entity | Notes |
|--------|------------|--------|-------|
| Connect WorkFlowy | Enter and verify the API key | Connection | Stored locally; first snapshot download follows |
| Change API key | Replace the stored key | Connection | Verified before replacing |
| Disconnect | Delete the key and the tree snapshot | Connection | Confirmed; sessions and saved destinations are kept |
| Refresh snapshot | Re-download the whole tree | TreeSnapshot | Also automatic; max 1 request per minute |

## Edge Cases

- **Key rejected on first connect**: the field stays filled, a plain explanation is shown, nothing is stored.
- **Network failure during connect or refresh**: a plain message with a retry; the previous snapshot stays in use.
- **Rate limit hit on manual refresh**: button disabled with the time until the next allowed refresh.
- **Very large tree**: the first download can take a while — the connect flow needs a clear "downloading" state (details in `proto-edgecases`).
- **Key becomes invalid mid-session**: the session is interrupted, not ended; it resumes after the key is fixed.
- **Reconnecting with a different WorkFlowy account**: the key's account is remembered. A key from another account asks for confirmation ("Switch to a different account?"); only after the new connection is saved are the old account's entries, sessions and saved places cleared.
- **Local storage unavailable or full**: the connection is saved all-or-nothing, key last; if any write fails everything is rolled back and the user is told "Couldn't save your connection in this browser" — never "connected" with nothing stored.
- **Saved connection unreadable**: the connect screen says so; the damaged value is not deleted silently.
- **A key that stops working**: any module that gets "unauthorized" from WorkFlowy marks the connection invalid, which leads to the invalid-key notice; the session stays stored.
- **Refresh fails** (network): the current snapshot is kept and the status line says so. While the rate limit holds, Refresh is disabled with a live countdown.
- **Automatic refresh**: when the app opens or the tab regains focus and the snapshot is over an hour old, it refreshes quietly.
- **Pasted key**: whitespace, surrounding quotes and a "Bearer " prefix are stripped; an empty field is rejected immediately; the key can be shown to check it.
- **Cancel while connecting**: stops the attempt and leaves the previous connection untouched.
- **Shared origin (GitHub Pages)**: every stored key is prefixed `wfb:` so the app does not collide with other sites of the same account; data saved under the old names moves over once.

## Integration Points

- **days**: the tree snapshot is the source of days and entries; a missing or invalid connection replaces the home screen with a prompt to connect.
- **note-filing**: destinations are searched in the tree snapshot.
- **review-session**: an invalid key interrupts the session; the session resumes after the key is fixed.
