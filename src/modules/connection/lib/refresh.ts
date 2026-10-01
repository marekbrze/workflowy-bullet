import { writeStorage } from '@/shared/lib/storage'
import { todayISO } from '@/shared/dates'
import { reportAuthFailure, AuthError } from './auth'
import { getLiveApi } from './live'
import { loadMirrors } from './mirrors'
import { getSnapshotState, setRefreshing, setSnapshot } from './snapshot-state'
import { saveSnapshot, type StoredSnapshot } from './snapshot-store'
import { deriveEntries } from './tree'
import { NetworkError, RateLimitError, type WorkflowyApi } from './workflowy-api'

/** WorkFlowy allows one `/nodes-export` request per minute. */
export const REFRESH_LIMIT_SECONDS = 60

export type RefreshResult =
  | { ok: true }
  | { ok: false; reason: 'rate-limit'; retryInSeconds: number }
  | { ok: false; reason: 'network' }
  | { ok: false; reason: 'auth' }

/** The tree and the id of the calendar, as one snapshot. */
export async function downloadSnapshot(
  api: WorkflowyApi,
  signal?: AbortSignal,
): Promise<StoredSnapshot> {
  const [nodes, calendar] = await Promise.all([api.exportNodes(signal), api.getNode('calendar', signal)])
  return { nodes, calendarId: calendar.id, refreshedAt: new Date().toISOString() }
}

/**
 * Makes a downloaded snapshot current: keeps it in memory and in IndexedDB and re-derives the
 * entries the app works with. Returns `false` if the entries could not be saved.
 */
export async function applySnapshot(snapshot: StoredSnapshot): Promise<boolean> {
  const index = setSnapshot(snapshot)
  // IndexedDB can be unavailable; the snapshot then lasts for this visit and the app carries on.
  await saveSnapshot(snapshot)
  return writeStorage('entries', deriveEntries(index, todayISO(), loadMirrors()))
}

let inFlight: Promise<RefreshResult> | null = null

/** Re-downloads the tree. Several callers at once share one request. */
export function refreshLive(): Promise<RefreshResult> {
  if (inFlight) return inFlight
  inFlight = (async (): Promise<RefreshResult> => {
    const api = getLiveApi()
    if (!api) return { ok: false, reason: 'auth' }
    const { refreshedAt } = getSnapshotState()
    if (refreshedAt) {
      const elapsed = (Date.now() - new Date(refreshedAt).getTime()) / 1000
      if (elapsed < REFRESH_LIMIT_SECONDS) {
        return { ok: false, reason: 'rate-limit', retryInSeconds: Math.ceil(REFRESH_LIMIT_SECONDS - elapsed) }
      }
    }
    setRefreshing(true)
    try {
      const saved = await applySnapshot(await downloadSnapshot(api))
      return saved ? { ok: true } : { ok: false, reason: 'network' }
    } catch (error) {
      if (error instanceof AuthError) {
        reportAuthFailure()
        return { ok: false, reason: 'auth' }
      }
      if (error instanceof RateLimitError) {
        return { ok: false, reason: 'rate-limit', retryInSeconds: REFRESH_LIMIT_SECONDS }
      }
      if (error instanceof NetworkError) return { ok: false, reason: 'network' }
      return { ok: false, reason: 'network' }
    } finally {
      setRefreshing(false)
    }
  })().finally(() => {
    inFlight = null
  })
  return inFlight
}
