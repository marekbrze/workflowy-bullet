import { useEffect, useState } from 'react'
import { useTreeSnapshot } from './use-tree-snapshot'

/**
 * A manual refresh with its feedback in one place: what happened, and a live countdown while
 * WorkFlowy's one-request-per-minute limit holds. Shared by every screen that offers Refresh.
 */
export function useRefreshControl() {
  const { nodes, refreshedAt, refresh } = useTreeSnapshot()
  const [outcome, setOutcome] = useState<string | null>(null)
  const [retryUntil, setRetryUntil] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (retryUntil === null) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [retryUntil])

  const secondsLeft = retryUntil === null ? 0 : Math.max(0, Math.ceil((retryUntil - now) / 1000))
  const rateLimited = secondsLeft > 0

  const run = () => {
    const result = refresh()
    if (result.ok) {
      setRetryUntil(null)
      setOutcome('Tree refreshed.')
    } else if (result.reason === 'rate-limit') {
      setNow(Date.now())
      setRetryUntil(Date.now() + result.retryInSeconds * 1000)
      setOutcome(null)
    } else {
      setRetryUntil(null)
      setOutcome("Couldn't reach WorkFlowy. Your current tree is unchanged.")
    }
  }

  return {
    nodes,
    refreshedAt,
    refresh: run,
    rateLimited,
    secondsLeft,
    /** What to tell the user right now, or `null` */
    message: rateLimited
      ? `WorkFlowy allows one refresh per minute. You can refresh again in ${secondsLeft} s.`
      : outcome,
    clearMessage: () => setOutcome(null),
  }
}
