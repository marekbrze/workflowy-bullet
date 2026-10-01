import { useEffect, useSyncExternalStore } from 'react'
import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import type { Destination } from '@/modules/note-filing/types/destination'
import { ensureSnapshotLoaded, getSnapshotState, subscribeSnapshot } from '../lib/snapshot-state'
import { REFRESH_LIMIT_SECONDS, refreshLive, type RefreshResult } from '../lib/refresh'
import type { ConnectionRecord, ConnectionStatus } from '../types/connection'

export { REFRESH_LIMIT_SECONDS }
export type { RefreshResult }

/** After this long the snapshot is flagged as possibly out of date — and refreshed on its own. */
export const STALE_AFTER_MINUTES = 60

export function isSnapshotStale(refreshedAt: string | null, now: number = Date.now()): boolean {
  if (!refreshedAt) return true
  return now - new Date(refreshedAt).getTime() > STALE_AFTER_MINUTES * 60_000
}

/** The background refresh runs only for a working connection with an old snapshot. */
export function shouldAutoRefresh(
  status: ConnectionStatus,
  refreshedAt: string | null,
  now: number = Date.now(),
): boolean {
  return status === 'connected' && isSnapshotStale(refreshedAt, now)
}

interface SnapshotMeta {
  refreshedAt: string
}

const SIMULATE_REFRESH_FAILURE_KEY = '__simulate_refresh_failure__'

// Dev-only: set this key to "1" in the console to make the next demo refresh fail once.
function maybeSimulateRefreshFailure(): boolean {
  if (!import.meta.env.DEV) return false
  if (window.localStorage.getItem(SIMULATE_REFRESH_FAILURE_KEY) !== '1') return false
  window.localStorage.removeItem(SIMULATE_REFRESH_FAILURE_KEY)
  return true
}

/**
 * The downloaded tree and its freshness. With a live connection it comes from the snapshot kept in
 * IndexedDB; in demo mode (development scenarios) it is the sample data in LocalStorage.
 */
export function useTreeSnapshot() {
  const state = useSyncExternalStore(subscribeSnapshot, getSnapshotState)
  const [records] = useLocalStorage<ConnectionRecord[]>('connection', [], { reportFailure: false })
  const live = records[0]?.mode === 'live'

  const [demoNodes] = useLocalStorage<Destination[]>('tree-nodes', [])
  // Stored as a one-element array so scenarios (which seed arrays) can provide it.
  const [demoMeta, setDemoMeta] = useLocalStorage<SnapshotMeta[]>('tree-snapshot', [])

  useEffect(() => {
    if (live) void ensureSnapshotLoaded()
  }, [live])

  const refreshedAt = live ? state.refreshedAt : (demoMeta[0]?.refreshedAt ?? null)

  const refresh = async (): Promise<RefreshResult> => {
    if (live) return refreshLive()
    if (refreshedAt) {
      const elapsed = (Date.now() - new Date(refreshedAt).getTime()) / 1000
      if (elapsed < REFRESH_LIMIT_SECONDS) {
        return {
          ok: false,
          reason: 'rate-limit',
          retryInSeconds: Math.ceil(REFRESH_LIMIT_SECONDS - elapsed),
        }
      }
    }
    if (maybeSimulateRefreshFailure()) return { ok: false, reason: 'network' }
    setDemoMeta([{ refreshedAt: new Date().toISOString() }])
    return { ok: true }
  }

  return {
    nodes: live ? state.destinations : demoNodes,
    refreshedAt,
    /** The tree is still being read from storage */
    loading: live && state.status !== 'ready',
    refreshing: live && state.refreshing,
    refresh,
  }
}
