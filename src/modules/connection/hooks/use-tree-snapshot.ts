import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import type { Destination } from '@/modules/note-filing/types/destination'
import type { ConnectionStatus } from '../types/connection'

/** WorkFlowy allows one `/nodes-export` request per minute. */
export const REFRESH_LIMIT_SECONDS = 60

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

export type RefreshResult =
  | { ok: true }
  | { ok: false; reason: 'rate-limit'; retryInSeconds: number }
  | { ok: false; reason: 'network' }

const SIMULATE_REFRESH_FAILURE_KEY = '__simulate_refresh_failure__'

// Dev-only: set this key to "1" in the console to make the next refresh fail once.
function maybeSimulateRefreshFailure(): boolean {
  if (!import.meta.env.DEV) return false
  if (window.localStorage.getItem(SIMULATE_REFRESH_FAILURE_KEY) !== '1') return false
  window.localStorage.removeItem(SIMULATE_REFRESH_FAILURE_KEY)
  return true
}

// Mocked: the "tree" is a list of nodes in LocalStorage.
export function useTreeSnapshot() {
  const [nodes] = useLocalStorage<Destination[]>('tree-nodes', [])
  // Stored as a one-element array so scenarios (which seed arrays) can provide it.
  const [meta, setMeta] = useLocalStorage<SnapshotMeta[]>('tree-snapshot', [])
  const refreshedAt = meta[0]?.refreshedAt ?? null

  const refresh = (): RefreshResult => {
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
    // The previous snapshot stays untouched when the request fails.
    if (maybeSimulateRefreshFailure()) return { ok: false, reason: 'network' }
    setMeta([{ refreshedAt: new Date().toISOString() }])
    return { ok: true }
  }

  return { nodes, refreshedAt, refresh }
}
