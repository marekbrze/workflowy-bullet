import { useEffect, useRef } from 'react'
import { shouldAutoRefresh, useTreeSnapshot } from '../hooks/use-tree-snapshot'
import { useConnection } from '../hooks/use-connection'

/**
 * Keeps the tree snapshot current without being asked: when the app opens or the tab regains
 * focus and the snapshot is old, it refreshes quietly (still within WorkFlowy's rate limit).
 */
export function SnapshotAutoRefresh() {
  const { status } = useConnection()
  const { refreshedAt, refresh, loading } = useTreeSnapshot()

  const latest = useRef({ status, refreshedAt, refresh, loading })
  useEffect(() => {
    latest.current = { status, refreshedAt, refresh, loading }
  })

  const check = () => {
    const current = latest.current
    // Until the stored snapshot has been read, "no refresh date" only means "not loaded yet".
    if (current.loading) return
    if (shouldAutoRefresh(current.status, current.refreshedAt)) void current.refresh()
  }

  // Once the stored snapshot is available — that is "the app opened".
  useEffect(() => {
    if (!loading) check()
  }, [loading, status])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return null
}
