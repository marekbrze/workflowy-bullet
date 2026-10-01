import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatFullDate } from '@/shared/dates'
import { dayStatusText, limitItems, type DaySummary } from '../lib/days'

interface BacklogBlockProps {
  days: DaySummary[]
  /** Entries left in an active `backlog` session, if there is one */
  remaining: number | null
  onStart: () => void
}

/** The expanded list shows this many of the oldest days until asked for more. */
const LIST_LIMIT = 30

// Deliberately a counter and one button — the full list is behind an expander.
export function BacklogBlock({ days, remaining, onStart }: BacklogBlockProps) {
  const [showAll, setShowAll] = useState(false)
  const resuming = remaining !== null
  const finished = resuming && remaining === 0
  const shown = limitItems(days, LIST_LIMIT, showAll)

  return (
    <section aria-labelledby="backlog-heading">
      <h2 id="backlog-heading" className="text-lg font-semibold">
        Backlog
      </h2>
      {days.length === 0 && !resuming ? (
        <p className="mt-2 text-sm text-muted-foreground">No open days older than yesterday.</p>
      ) : (
        <div className="mt-2 rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground tabular-nums">
            {finished
              ? 'Everything is processed — finish your session.'
              : resuming
                ? `${remaining} left in your backlog session`
                : `${days.length} open ${days.length === 1 ? 'day' : 'days'}`}
          </p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={onStart}
            aria-label={
              finished
                ? 'Finish backlog session'
                : resuming
                  ? 'Continue backlog session'
                  : 'Start backlog session with the oldest day'
            }
          >
            {finished ? 'Finish' : resuming ? 'Continue' : 'Start with the oldest'}
          </Button>
          {days.length > 0 && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-muted-foreground">Show all open days</summary>
              <ul className="mt-2 divide-y">
                {shown.map((day) => (
                  <li key={day.date} className="flex justify-between gap-2 py-1.5">
                    <span>{formatFullDate(day.date)}</span>
                    <span className="text-muted-foreground tabular-nums">{dayStatusText(day)}</span>
                  </li>
                ))}
              </ul>
              {days.length > LIST_LIMIT && (
                <Button variant="ghost" size="sm" className="mt-1" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'Show fewer' : `Show all ${days.length}`}
                </Button>
              )}
            </details>
          )}
        </div>
      )}
    </section>
  )
}
