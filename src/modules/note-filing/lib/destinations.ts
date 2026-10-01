import { MAX_RECENT, type SavedDestination } from '../types/saved-destination'
import type { Destination } from '../types/destination'

export const MAX_RESULTS = 8

/** Name matches first (prefix before substring), then matches on the path. */
export function searchDestinations(
  nodes: Destination[],
  query: string,
  limit: number = MAX_RESULTS,
): Destination[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return nodes
    .map((node) => {
      const name = node.name.toLowerCase()
      let score = -1
      if (name.startsWith(q)) score = 0
      else if (name.includes(q)) score = 1
      else if (node.path.join(' ').toLowerCase().includes(q)) score = 2
      return { node, score }
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => a.score - b.score || a.node.name.localeCompare(b.node.name))
    .slice(0, limit)
    .map((item) => item.node)
}

export function pinnedDestinations(saved: SavedDestination[]): Destination[] {
  return saved.filter((s) => s.pinned).map((s) => s.destination)
}

/** Most recently used first; pinned places are shown in their own list. */
export function recentDestinations(saved: SavedDestination[]): Destination[] {
  return saved
    .filter((s) => !s.pinned && s.usedAt)
    .sort((a, b) => (b.usedAt ?? '').localeCompare(a.usedAt ?? ''))
    .slice(0, MAX_RECENT)
    .map((s) => s.destination)
}

export function togglePin(saved: SavedDestination[], destination: Destination): SavedDestination[] {
  const existing = saved.find((s) => s.id === destination.id)
  if (!existing) {
    return [...saved, { id: destination.id, destination, pinned: true, usedAt: null }]
  }
  if (existing.pinned && !existing.usedAt) return saved.filter((s) => s.id !== destination.id)
  return saved.map((s) => (s.id === destination.id ? { ...s, pinned: !s.pinned } : s))
}

/** Records a use and drops unpinned entries that fell off the recent list. */
export function markUsed(
  saved: SavedDestination[],
  destination: Destination,
  now: string,
): SavedDestination[] {
  const existing = saved.find((s) => s.id === destination.id)
  const next = existing
    ? saved.map((s) => (s.id === destination.id ? { ...s, destination, usedAt: now } : s))
    : [...saved, { id: destination.id, destination, pinned: false, usedAt: now }]
  const keep = new Set(
    next
      .filter((s) => !s.pinned)
      .sort((a, b) => (b.usedAt ?? '').localeCompare(a.usedAt ?? ''))
      .slice(0, MAX_RECENT)
      .map((s) => s.id),
  )
  return next.filter((s) => s.pinned || keep.has(s.id))
}
