import { useEffect, useRef } from 'react'
import { shouldAutoRefresh, useTreeSnapshot } from '../hooks/use-tree-snapshot'
import { useConnection } from '../hooks/use-connection'

/**
 * Keeps the tree snapshot current without being asked: when the app opens or the tab regains
 * focus and the snapshot is old, it refreshes quietly (still within WorkFlowy's rate limit).
 */
export function SnapshotAutoRefresh() {
  const { status } = useConnection()
  const { refreshedAt, refresh } = useTreeSnapshot()

  const latest = useRef({ status, refreshedAt, refresh })
  useEffect(() => {
    latest.current = { status, refreshedAt, refresh }
  })

  useEffect(() => {
    const check = () => {
      const current = latest.current
      if (shouldAutoRefresh(current.status, current.refreshedAt)) current.refresh()
    }
    check()
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
