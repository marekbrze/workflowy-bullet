import type { Destination } from '@/modules/note-filing/types/destination'
import { buildDestinations, buildIndex, type TreeIndex } from './tree'
import { loadSnapshot, type StoredSnapshot } from './snapshot-store'

export interface SnapshotState {
  status: 'idle' | 'loading' | 'ready'
  /** The tree in memory, for deriving entries and for copying bullets */
  index: TreeIndex | null
  /** Every bullet a note can be mirrored under */
  destinations: Destination[]
  refreshedAt: string | null
  refreshing: boolean
}

let state: SnapshotState = {
  status: 'idle',
  index: null,
  destinations: [],
  refreshedAt: null,
  refreshing: false,
}
const listeners = new Set<() => void>()

function set(next: Partial<SnapshotState>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

export const getSnapshotState = () => state

export function subscribeSnapshot(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Makes a downloaded or stored snapshot the one the app works with. */
export function setSnapshot(snapshot: StoredSnapshot): TreeIndex {
  const index = buildIndex(snapshot.nodes, snapshot.calendarId)
  set({
    status: 'ready',
    index,
    destinations: buildDestinations(index),
    refreshedAt: snapshot.refreshedAt,
  })
  return index
}

export function clearSnapshotState(): void {
  set({ status: 'idle', index: null, destinations: [], refreshedAt: null, refreshing: false })
}

export function setRefreshing(refreshing: boolean): void {
  set({ refreshing })
}

let loading: Promise<void> | null = null

/** Loads the stored snapshot once per page load. */
export function ensureSnapshotLoaded(): Promise<void> {
  if (state.status !== 'idle') return loading ?? Promise.resolve()
  set({ status: 'loading' })
  loading = loadSnapshot().then((stored) => {
    if (stored) setSnapshot(stored)
    else set({ status: 'ready' })
  })
  return loading
}
