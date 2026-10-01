import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DestinationPicker } from '@/modules/note-filing/components/DestinationPicker'
import type { Destination } from '@/modules/note-filing/types/destination'
import type { Entry, EntryType } from '@/modules/review-session/types/entry'
import { limitItems } from '../lib/days'

interface TodayListProps {
  entries: Entry[]
  waiting: number
  /** Entries left in an active `today` session, if there is one */
  remaining: number | null
  /** Open tasks that were rolled over to tomorrow */
  tomorrowCount?: number
  /** Return `false` when the change could not be saved */
  onQuickType: (id: string, type: EntryType) => boolean | void
  onFileNote: (id: string, destination: Destination) => boolean
  onStart: () => void
}

/** More entries than this are tucked behind "Show all". */
const VISIBLE_LIMIT = 20

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

/** A completed task is history; everything else can still be corrected. */
function canChangeType(entry: Entry): boolean {
  return entry.type !== null && !(entry.type === 'task' && entry.outcome !== 'open')
}

export function TodayList({
  entries,
  waiting,
  remaining,
  tomorrowCount = 0,
  onQuickType,
  onFileNote,
  onStart,
}: TodayListProps) {
  const [retypingId, setRetypingId] = useState<string | null>(null)
  const [filingId, setFilingId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const resuming = remaining !== null
  const finished = resuming && remaining === 0
  const canStart = resuming || waiting > 0
  const visible = limitItems(entries, VISIBLE_LIMIT, showAll)
  const filing = entries.find((e) => e.id === filingId) ?? null

  const typeRow = (entry: Entry) => {
    const retyping = retypingId === entry.id
    return (
      <span role="group" aria-label={`Set type for ${entry.text}`} className="flex gap-1">
        {TYPES.map(({ type, label }) => (
          <Button
            key={type}
            variant="outline"
            size="xs"
            aria-label={`${label}: ${entry.text}`}
            aria-pressed={retyping ? entry.type === type : undefined}
            onClick={() => {
              if (onQuickType(entry.id, type) !== false) setRetypingId(null)
            }}
          >
            {label}
          </Button>
        ))}
        {retyping && (
          <Button variant="ghost" size="xs" onClick={() => setRetypingId(null)}>
            Cancel
          </Button>
        )}
      </span>
    )
  }

  return (
    <section aria-labelledby="today-heading">
      <div className="flex items-center justify-between gap-2">
        <h2 id="today-heading" className="text-lg font-semibold">
          Today
        </h2>
        {canStart && (
          <Button variant="outline" size="sm" onClick={onStart}>
            {finished
              ? 'Finish today session'
              : resuming
                ? 'Continue today session'
                : 'Start today session'}
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nothing captured today yet.</p>
      ) : (
        <ul className="mt-2 divide-y rounded-xl border">
          {visible.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 break-words text-sm">{entry.text}</span>
              {!entry.type || retypingId === entry.id ? (
                typeRow(entry)
              ) : (
                <span className="flex flex-wrap items-center gap-1">
                  <span className="text-xs text-muted-foreground">{statusLabel(entry)}</span>
                  {entry.type === 'note' && (
                    <>
                      {entry.mirroredTo && (
                        <span className="text-xs text-muted-foreground">
                          · mirrored to {entry.mirroredTo.name}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="xs"
                        aria-label={`${entry.mirroredTo ? 'Move' : 'File'} note: ${entry.text}`}
                        onClick={() => setFilingId(entry.id)}
                      >
                        {entry.mirroredTo ? 'Move…' : 'File…'}
                      </Button>
                    </>
                  )}
                  {canChangeType(entry) && (
                    <Button
                      variant="ghost"
                      size="xs"
                      aria-label={`Change type: ${entry.text}`}
                      onClick={() => setRetypingId(entry.id)}
                    >
                      Change
                    </Button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {entries.length > VISIBLE_LIMIT && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer' : `Show all ${entries.length}`}
        </Button>
      )}

      {tomorrowCount > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {tomorrowCount} {tomorrowCount === 1 ? 'task' : 'tasks'} waiting for tomorrow
        </p>
      )}

      <DestinationPicker
        open={filing !== null}
        currentMirror={filing?.mirroredTo}
        excludeIds={filing ? [filing.id] : undefined}
        onPick={(destination) => {
          if (!filing) return
          if (destination === null) {
            setFilingId(null)
            return
          }
          const ok = onFileNote(filing.id, destination)
          if (ok) setFilingId(null)
          return ok
        }}
      />
    </section>
  )
}
