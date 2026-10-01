import { MAX_RECENT, type SavedDestination } from '../types/saved-destination'
import type { Destination } from '../types/destination'

export const MAX_RESULTS = 8

/** A node with its searchable text lower-cased once, so each keystroke only compares strings. */
export interface SearchIndexItem {
  node: Destination
  name: string
  path: string
}

export function buildSearchIndex(nodes: Destination[]): SearchIndexItem[] {
  return nodes.map((node) => ({
    node,
    name: node.name.toLowerCase(),
    path: node.path.join(' ').toLowerCase(),
  }))
}

export interface SearchOptions {
  limit?: number
  /** Never offered, e.g. the note being filed */
  excludeIds?: string[]
}

export interface SearchPage {
  results: Destination[]
  /** All matches, before the limit */
  total: number
}

/** Name matches first (prefix before substring), then matches on the path. */
export function searchIndex(
  index: SearchIndexItem[],
  query: string,
  { limit = MAX_RESULTS, excludeIds = [] }: SearchOptions = {},
): SearchPage {
  const q = query.trim().toLowerCase()
  if (!q) return { results: [], total: 0 }
  const excluded = new Set(excludeIds)
  const matches = index
    .filter((item) => !excluded.has(item.node.id))
    .map((item) => {
      let score = -1
      if (item.name.startsWith(q)) score = 0
      else if (item.name.includes(q)) score = 1
      else if (item.path.includes(q)) score = 2
      return { node: item.node, score }
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => a.score - b.score || a.node.name.localeCompare(b.node.name))
  return { results: matches.slice(0, limit).map((m) => m.node), total: matches.length }
}

export function searchDestinations(
  nodes: Destination[],
  query: string,
  limit: number = MAX_RESULTS,
): Destination[] {
  return searchIndex(buildSearchIndex(nodes), query, { limit }).results
}

/** Last two path segments, with an ellipsis when the path is longer — the closest parents tell nodes apart. */
export function formatPath(path: string[]): string {
  if (path.length <= 2) return path.join(' › ')
  return `… › ${path.slice(-2).join(' › ')}`
}

/** Alphabetical, so the order does not depend on when a place was pinned. */
export function pinnedDestinations(saved: SavedDestination[]): Destination[] {
  return saved
    .filter((s) => s.pinned)
    .map((s) => s.destination)
    .sort((a, b) => a.name.localeCompare(b.name) || a.path.join().localeCompare(b.path.join()))
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
