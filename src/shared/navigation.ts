export interface NavItem {
  /** Module code name from docs/MODULES.md */
  module: string
  /** Label shown to the user */
  label: string
  to: string
}

// Only modules the user navigates to directly. `review-session` is a focus-mode
// flow entered from `days`, and `note-filing` is an overlay inside it — neither
// has a nav entry (see docs/UI-STRATEGY.md).
export const NAV_ITEMS: NavItem[] = [
  { module: 'days', label: 'Today', to: '/' },
  { module: 'connection', label: 'Connection', to: '/connection' },
]

export const APP_NAME = 'workflowy-bullet'

export const REVIEW_SESSION_PATH = '/review-session'
