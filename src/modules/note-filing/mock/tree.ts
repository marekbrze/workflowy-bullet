import type { Destination } from '../types/destination'
import type { SavedDestination } from '../types/saved-destination'

function node(path: string[], name: string, childCount: number): Destination {
  const id = `dest-${[...path, name].join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return { id, name, path, childCount }
}

/** A small mock of the user's WorkFlowy tree. "Ideas" appears twice on purpose. */
export const MOCK_TREE: Destination[] = [
  node(['Projects', 'Home'], 'Renovation', 8),
  node(['Projects', 'Home'], 'Garden', 5),
  node(['Projects', 'Home'], 'Moving checklist', 14),
  node(['Projects', 'Learning'], 'Reading list', 12),
  node(['Projects', 'Learning'], 'Courses', 6),
  node(['Projects', 'Learning'], 'Notes on Rust', 9),
  node(['Projects', 'Work'], 'Q4 planning', 10),
  node(['Projects', 'Work'], 'Retrospectives', 7),
  node(['Projects', 'Work'], 'Team offsite', 4),
  node(['Projects', 'Work'], 'Hiring', 5),
  node(['Projects', 'Work'], 'Ideas', 11),
  node(['Areas', 'Writing'], 'Ideas', 23),
  node(['Areas', 'Health'], 'Workouts', 18),
  node(['Areas', 'Health'], 'Doctors', 6),
  node(['Areas', 'Finance'], 'Taxes 2026', 7),
  node(['Areas', 'Finance'], 'Subscriptions', 12),
  node(['Inbox'], 'Ideas inbox', 34),
  node(['Inbox'], 'Someday maybe', 21),
  node(['People'], 'Piotr', 6),
  node(['People'], 'Anna', 3),
  node(['People'], 'Marta', 4),
  node(['People'], 'Grandma', 2),
  node(['Recipes'], 'Soups', 9),
  node(['Recipes'], 'Baking', 14),
]

const byName = (name: string, parent: string) =>
  MOCK_TREE.find((n) => n.name === name && n.path.at(-1) === parent)!

function saved(destination: Destination, pinned: boolean, minutesAgo: number | null): SavedDestination {
  return {
    id: destination.id,
    destination,
    pinned,
    usedAt: minutesAgo === null ? null : new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  }
}

/** Two pinned places and three recent ones. */
export function buildSavedDestinations(): SavedDestination[] {
  return [
    saved(byName('Reading list', 'Learning'), true, null),
    saved(byName('Ideas inbox', 'Inbox'), true, 60),
    saved(byName('Renovation', 'Home'), false, 90),
    saved(byName('Piotr', 'People'), false, 1_500),
    saved(byName('Soups', 'Recipes'), false, 4_000),
  ]
}

/** One-element array: scenarios seed arrays, and the hook reads the first item. */
export function buildSnapshotMeta(minutesAgo = 12): { refreshedAt: string }[] {
  return [{ refreshedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString() }]
}
