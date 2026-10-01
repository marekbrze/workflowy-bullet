import { Button } from '@/components/ui/button'
import type { Entry, EntryType } from '@/modules/review-session/types/entry'

interface TodayListProps {
  entries: Entry[]
  waiting: number
  /** Entries left in an active `today` session, if there is one */
  remaining: number | null
  onQuickType: (id: string, type: EntryType) => void
  onStart: () => void
}

const TYPES: { type: EntryType; label: string }[] = [
  { type: 'task', label: 'Task' },
  { type: 'note', label: 'Note' },
  { type: 'event', label: 'Event' },
]

function statusLabel(entry: Entry): string {
  if (!entry.type) return ''
  if (entry.type === 'task' && entry.outcome && entry.outcome !== 'open') {
    return `#task · ${entry.outcome}`
  }
  return `#${entry.type}`
}

export function TodayList({ entries, waiting, remaining, onQuickType, onStart }: TodayListProps) {
  const resuming = remaining !== null
  const canStart = resuming || waiting > 0

  return (
    <section aria-labelledby="today-heading">
      <div className="flex items-center justify-between gap-2">
        <h2 id="today-heading" className="text-lg font-semibold">
          Today
        </h2>
        {canStart && (
          <Button variant="outline" size="sm" onClick={onStart}>
            {resuming ? 'Continue today session' : 'Start today session'}
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nothing captured today yet.</p>
      ) : (
        <ul className="mt-2 divide-y rounded-xl border">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 text-sm">{entry.text}</span>
              {entry.type ? (
                <span className="text-xs text-muted-foreground">{statusLabel(entry)}</span>
              ) : (
                <span role="group" aria-label={`Set type for ${entry.text}`} className="flex gap-1">
                  {TYPES.map(({ type, label }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="xs"
                      aria-label={`${label}: ${entry.text}`}
                      onClick={() => onQuickType(entry.id, type)}
                    >
                      {label}
                    </Button>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
