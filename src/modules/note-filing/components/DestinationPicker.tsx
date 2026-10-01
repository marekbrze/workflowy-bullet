import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/shared/components/Kbd'
import { ModalDialog } from '@/shared/components/ModalDialog'
import { WriteErrorNotice } from '@/shared/components/WriteErrorNotice'
import { formatAgo } from '@/shared/dates'
import { useTreeSnapshot } from '@/modules/connection/hooks/use-tree-snapshot'
import { searchDestinations } from '../lib/destinations'
import { useSavedDestinations } from '../hooks/use-saved-destinations'
import type { Destination } from '../types/destination'

interface DestinationPickerProps {
  open: boolean
  /**
   * `null` keeps the note in its day. Return `false` when saving the choice failed, so the
   * destination is not remembered as "recent" and the picker can stay open.
   */
  onPick: (destination: Destination | null) => boolean | void
  /** A failed write: shown inside the picker, which stays open */
  error?: boolean
  onRetry?: () => void
  onDismissError?: () => void
}

type PickerBodyProps = Pick<DestinationPickerProps, 'onPick' | 'error' | 'onRetry' | 'onDismissError'>

export function DestinationPicker({ open, onPick, error, onRetry, onDismissError }: DestinationPickerProps) {
  return (
    <ModalDialog open={open} title="Where should this note live?" onCancel={() => onPick(null)}>
      {/* Mounted only while open, so the query and selection reset every time. */}
      <PickerBody onPick={onPick} error={error} onRetry={onRetry} onDismissError={onDismissError} />
    </ModalDialog>
  )
}

interface Row {
  destination: Destination
  section: 'Pinned' | 'Recent' | 'Result'
}

function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const q = query.trim().toLowerCase()
  const index = q ? text.toLowerCase().indexOf(q) : -1
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent font-semibold text-foreground underline">
        {text.slice(index, index + q.length)}
      </mark>
      {text.slice(index + q.length)}
    </>
  )
}

function PickerBody({ onPick, error, onRetry, onDismissError }: PickerBodyProps) {
  const listId = useId()
  const optionId = (index: number) => `${listId}-option-${index}`
  const { nodes, refreshedAt, refresh } = useTreeSnapshot()
  const saved = useSavedDestinations()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [refreshNote, setRefreshNote] = useState<string | null>(null)

  const searching = query.trim().length > 0
  const rows: Row[] = searching
    ? searchDestinations(nodes, query).map((destination) => ({ destination, section: 'Result' }))
    : [
        ...saved.pinned.map((destination): Row => ({ destination, section: 'Pinned' })),
        ...saved.recent.map((destination): Row => ({ destination, section: 'Recent' })),
      ]
  const activeIndex = Math.min(active, Math.max(rows.length - 1, 0))

  const pick = (destination: Destination) => {
    const ok = onPick(destination)
    if (ok !== false) saved.markUsed(destination)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (rows.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((activeIndex + 1) % rows.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((activeIndex - 1 + rows.length) % rows.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      pick(rows[activeIndex].destination)
    }
  }

  const onRefresh = () => {
    const result = refresh()
    setRefreshNote(
      result.ok
        ? 'Tree refreshed.'
        : `WorkFlowy allows one refresh per minute. Try again in ${result.retryInSeconds} s.`,
    )
  }

  let lastSection: Row['section'] | null = null

  return (
    <>
      <label htmlFor={`${listId}-search`} className="sr-only">
        Search WorkFlowy
      </label>
      <input
        id={`${listId}-search`}
        type="text"
        role="combobox"
        aria-expanded={rows.length > 0}
        aria-controls={listId}
        aria-activedescendant={rows.length > 0 ? optionId(activeIndex) : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Search WorkFlowy…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
          setRefreshNote(null)
        }}
        onKeyDown={onKeyDown}
        className="mt-3 h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      {rows.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Destinations" className="mt-2 max-h-72 overflow-y-auto">
          {rows.map((row, index) => {
            const showHeading = row.section !== 'Result' && row.section !== lastSection
            lastSection = row.section
            const { destination } = row
            const pinned = saved.isPinned(destination.id)
            return (
              <li key={`${row.section}-${destination.id}`} role="presentation">
                {showHeading && (
                  <div aria-hidden="true" className="px-2 pb-1 pt-3 text-xs font-medium text-muted-foreground">
                    {row.section}
                  </div>
                )}
                <div
                  className={`flex items-center gap-1 rounded-lg ${index === activeIndex ? 'bg-muted' : ''}`}
                >
                  <button
                    type="button"
                    role="option"
                    id={optionId(index)}
                    aria-selected={index === activeIndex}
                    tabIndex={-1}
                    onClick={() => pick(destination)}
                    className="flex min-w-0 flex-1 flex-col items-start rounded-lg px-2 py-1.5 text-left outline-none"
                  >
                    <span className="sr-only">{row.section}: </span>
                    <span className="text-sm">
                      <Highlight text={destination.name} query={searching ? query : ''} />
                    </span>
                    <span className="max-w-full truncate text-xs text-muted-foreground">
                      {destination.path.join(' › ')} · {destination.childCount} items
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={pinned}
                    aria-label={`${pinned ? 'Unpin' : 'Pin'} ${destination.name}`}
                    onClick={() => saved.togglePin(destination)}
                    className="rounded-md px-2 py-1 text-base text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {pinned ? '★' : '☆'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {rows.length === 0 && searching && (
        <div role="status" className="mt-3 rounded-lg border p-3 text-sm">
          <p>No matches for &ldquo;{query.trim()}&rdquo;.</p>
          <p className="mt-1 text-muted-foreground">
            The tree may be out of date. Refresh it, or keep the note in its day.
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onRefresh}>
            Refresh tree
          </Button>
          {refreshNote && <p className="mt-2 text-muted-foreground">{refreshNote}</p>}
        </div>
      )}

      {rows.length === 0 && !searching && (
        <p className="mt-3 text-sm text-muted-foreground">
          Type to search. Places you pin or use will show up here.
        </p>
      )}

      {error && onRetry && <WriteErrorNotice onRetry={onRetry} onDismiss={onDismissError} />}

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {refreshedAt ? `Tree refreshed ${formatAgo(refreshedAt)}` : 'Tree not refreshed yet'}
        </p>
        <Button variant="ghost" onClick={() => onPick(null)}>
          Keep in day <Kbd>esc</Kbd>
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd> move <Kbd>enter</Kbd> select
      </p>
    </>
  )
}
