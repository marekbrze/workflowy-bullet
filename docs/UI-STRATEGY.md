# UI Strategy

## Platform
Responsive. Desktop is the primary context (the review flow is keyboard-first), but the layout also works on a phone, e.g. for the morning review.

## Navigation
- Type: thin top bar — app name on the left (links home), module links on the right.
- Mobile (responsive): the same top bar; with only two links it fits without a separate bottom-tab or hamburger variant.
- **Focus mode**: during a review session (`/review-session/:mode`) the top bar is hidden. Only the session is shown, with its own small "Exit" control.
- `review-session` is a flow entered from the home screen, and `note-filing` is an overlay inside it — neither appears in the navigation.

## Home page
The home screen of the `days` module ("Today"): Yesterday card, Today list, Backlog counter — see `docs/modules/days.md`. No separate landing page.

## Module navigation
| Module (code) | Label (display) | Route | In nav |
|---|---|---|---|
| days | Today | `/` | yes |
| review-session | Review | `/review-session/:mode` (`today` / `yesterday` / `backlog`) | no — focus mode |
| note-filing | — | none (overlay in review-session) | no |
| connection | Connection | `/connection` | yes |

## Content layout
- Container: contained, narrow — centered column, max-width `max-w-2xl` (~672 px), full width with a 16 px gutter on phones.
- Breadcrumbs: no.

## Shared elements
- Header: yes — the top bar (app name + links), hidden in focus mode.
- Footer: no.
- Notifications: no.
- Accessibility: "Skip to content" link, `nav` landmark labelled "Main", `main` landmark.

## Implementation
- `src/shared/navigation.ts` — nav items, app name, review-session path.
- `src/shared/components/AppShell.tsx` — shell: skip link, top bar, content container, focus-mode switch.
- `src/shared/components/ModulePlaceholder.tsx` — temporary route content until `proto-lofi` fills each module.
- `src/App.tsx` — React Router setup (`basename` from Vite's `BASE_URL` so the app works under the GitHub Pages path).
