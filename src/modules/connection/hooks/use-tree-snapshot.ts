import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import type { Destination } from '@/modules/note-filing/types/destination'

/** WorkFlowy allows one `/nodes-export` request per minute. */
export const REFRESH_LIMIT_SECONDS = 60

interface SnapshotMeta {
  refreshedAt: string
}

export type RefreshResult = { ok: true } | { ok: false; retryInSeconds: number }

// Mocked: the "tree" is a list of nodes in LocalStorage. `proto-lofi connection` extends this hook.
export function useTreeSnapshot() {
  const [nodes] = useLocalStorage<Destination[]>('tree-nodes', [])
  // Stored as a one-element array so scenarios (which seed arrays) can provide it.
  const [meta, setMeta] = useLocalStorage<SnapshotMeta[]>('tree-snapshot', [])
  const refreshedAt = meta[0]?.refreshedAt ?? null

  const refresh = (): RefreshResult => {
    if (refreshedAt) {
      const elapsed = (Date.now() - new Date(refreshedAt).getTime()) / 1000
      if (elapsed < REFRESH_LIMIT_SECONDS) {
        return { ok: false, retryInSeconds: Math.ceil(REFRESH_LIMIT_SECONDS - elapsed) }
      }
    }
    setMeta([{ refreshedAt: new Date().toISOString() }])
    return { ok: true }
  }

  return { nodes, refreshedAt, refresh }
}
