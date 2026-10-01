import { useEffect, useState } from 'react'
import { todayISO } from '@/shared/dates'

/** Milliseconds from `now` until just after the next local midnight. */
export function msUntilMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime() + 1000
}

/**
 * Today's date as `YYYY-MM-DD`, kept current: it updates at midnight and when the tab regains
 * focus, so a screen left open overnight does not keep showing yesterday as "Today".
 */
export function useToday(): string {
  const [today, setToday] = useState(todayISO)

  useEffect(() => {
    const refresh = () => setToday(todayISO())
    let timer = window.setTimeout(function tick() {
      refresh()
      timer = window.setTimeout(tick, msUntilMidnight(new Date()))
    }, msUntilMidnight(new Date()))
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return today
}
