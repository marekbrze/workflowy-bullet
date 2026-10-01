import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/shared/components/Kbd'
import { ModalDialog } from '@/shared/components/ModalDialog'
import { WriteErrorNotice } from '@/shared/components/WriteErrorNotice'
import { formatAgo } from '@/shared/dates'
import { useRefreshControl } from '@/modules/connection/hooks/use-refresh-control'
import { buildSearchIndex, formatPath, searchIndex } from '../lib/destinations'
import { useSavedDestinations } from '../hooks/use-saved-destinations'
import type { Destination } from '../types/destination'

interface DestinationPickerProps {
  open: boolean
  /**
   * `null` keeps the note as it is (in its day, and with its current mirror if it has one).
   * Return `false` when saving the choice failed, so the destination is not remembered as
   * "recent" and the picker can stay open.
   */
  onPick: (destination: Destination | null) => boolean | void
  /** The note's existing mirror, if any — a note has at most one, so picking a place moves it */
  currentMirror?: Destination | null
  /** Never offered as a destination, e.g. the note being filed */
  excludeIds?: string[]
  /** Steps back out without deciding. Shown only when there is something to go back to. */
  onBack?: () => void
  /** A failed write: shown inside the picker, which stays open */
  error?: boolean
  onRetry?: () => void
  onDismissError?: () => void
}

type PickerBodyProps = Omit<DestinationPickerProps, 'open'>

export function DestinationPicker({ open, ...body }: DestinationPickerProps) {
  return (
    <ModalDialog open={open} title="Where should this note live?" onCancel={() => body.onPick(null)}>
      {/* Mounted only while open, so the query and selection reset every time. */}
      <PickerBody {...body} />
    </ModalDialog>
  )
}

interface Row {
  destination: Destination
  section: 'Pinned' | 'Recent' | 'Result'
  /** A saved place that is no longer in the tree */
  missing: boolean
}

function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const q = query.trim().toLowerCase()
  const lower = text.toLowerCase()
  // Lower-casing can change the length of a few characters; then the indexes no longer line up.
  const index = q && lower.length === text.length ? lower.indexOf(q) : -1
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

const MISSING_NOTE = 'That place is no longer in your tree. Unpin it, or choose another.'

function PickerBody({
  onPick,
  currentMirror,
  excludeIds,
  onBack,
  error,
  onRetry,
  onDismissError,
}: PickerBodyProps) {
  const listId = useId()
  const optionId = (index: number) => `${listId}-option-${index}`
  const { nodes, refreshedAt, refresh, rateLimited, message: refreshMessage } = useRefreshControl()
  const saved = useSavedDestinations()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [note, setNote] = useState<string | null>(null)

  // Typing stays responsive on a big tree: results follow the query a moment later.
  const deferredQuery = useDeferredValue(query)
  const index = useMemo(() => buildSearchIndex(nodes), [nodes])
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  const searching = deferredQuery.trim().length > 0
  const excluded = new Set(excludeIds)
  const toRow = (destination: Destination, section: Row['section']): Row => ({
    // Show what the tree says now, not the copy saved earlier.
    destination: byId.get(destination.id) ?? destination,
    section,
    // With no tree at all we cannot tell, so nothing is flagged.
    missing: nodes.length > 0 && !byId.has(destination.id),
  })
  const page = searching
    ? searchIndex(index, deferredQuery, { excludeIds })
    : { results: [], total: 0 }
  const rows: Row[] = searching
    ? page.results.map((destination) => toRow(destination, 'Result'))
    : [
        ...saved.pinned.filter((d) => !excluded.has(d.id)).map((d) => toRow(d, 'Pinned')),
        ...saved.recent.filter((d) => !excluded.has(d.id)).map((d) => toRow(d, 'Recent')),
      ]
  const activeIndex = Math.min(active, Math.max(rows.length - 1, 0))
  const hiddenResults = searching ? page.total - page.results.length : 0

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, rows.length])

  const pick = (row: Row) => {
    if (row.missing) {
      setNote(MISSING_NOTE)
      return
    }
    // Choosing the place the note is already mirrored to changes nothing.
    if (currentMirror && row.destination.id === currentMirror.id) {
      onPick(null)
      return
    }
    const ok = onPick(row.destination)
    if (ok !== false) saved.markUsed(row.destination)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Enter confirms an IME candidate; it must not pick a row.
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Backspace' && query === '' && onBack) {
      event.preventDefault()
      onBack()
      return
    }
    if (rows.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((activeIndex + 1) % rows.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((activeIndex - 1 + rows.length) % rows.length)
    } else if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      saved.togglePin(rows[activeIndex].destination)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      pick(rows[activeIndex])
    }
  }

  const refreshButton = (
    <Button variant="outline" size="sm" className="mt-2" onClick={refresh} disabled={rateLimited}>
      Refresh tree
    </Button>
  )

  let lastSection: Row['section'] | null = null
  const liveCount = searching
    ? rows.length === 0
      ? 'No matches'
      : `${page.total} ${page.total === 1 ? 'result' : 'results'}`
    : ''

  return (
    <>
      {currentMirror && (
        <div className="mt-3 rounded-lg border p-3 text-sm">
          <p>
            Currently mirrored to <strong>{currentMirror.name}</strong>
          </p>
          <p className="text-sm text-muted-foreground">{formatPath(currentMirror.path)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose another place to move the mirror, or keep it where it is.
          </p>
        </div>
      )}

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
          setNote(null)
        }}
        onKeyDown={onKeyDown}
        className="mt-3 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-ring"
      />
      <p className="sr-only" aria-live="polite">
        {liveCount}
      </p>

      {rows.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Destinations" className="mt-2 max-h-72 overflow-y-auto">
          {rows.map((row, rowIndex) => {
            const showHeading = row.section !== 'Result' && row.section !== lastSection
            lastSection = row.section
            const { destination, missing } = row
            const pinned = saved.isPinned(destination.id)
            const fullPath = destination.path.join(' › ')
            return (
              <li key={`${row.section}-${destination.id}`} role="presentation">
                {showHeading && (
                  <div aria-hidden="true" className="px-2 pb-1 pt-3 text-sm font-medium text-muted-foreground">
                    {row.section}
                  </div>
                )}
                <div
                  className={`flex items-center gap-1 rounded-lg ${rowIndex === activeIndex ? 'bg-accent' : ''}`}
                >
                  <button
                    type="button"
                    role="option"
                    id={optionId(rowIndex)}
                    aria-selected={rowIndex === activeIndex}
                    aria-disabled={missing || undefined}
                    tabIndex={-1}
                    onClick={() => pick(row)}
                    title={fullPath}
                    className={`flex min-w-0 flex-1 flex-col items-start rounded-lg px-2 py-1.5 text-left outline-none ${missing ? 'text-muted-foreground' : ''}`}
                  >
                    <span className="sr-only">{row.section}: </span>
                    <span className="break-words text-sm">
                      <Highlight text={destination.name} query={searching ? deferredQuery : ''} />
                    </span>
                    <span className="break-words text-sm text-muted-foreground">
                      {missing ? (
                        'No longer in your tree'
                      ) : (
                        <>
                          <Highlight
                            text={formatPath(destination.path)}
                            query={searching ? deferredQuery : ''}
                          />{' '}
                          · {destination.childCount} items
                        </>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={pinned}
                    aria-label={`${pinned ? 'Unpin' : 'Pin'} ${destination.name}`}
                    onClick={() => saved.togglePin(destination)}
                    className={`rounded-md px-2 py-1 text-base hover:bg-muted focus-ring ${pinned ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {pinned ? '★' : '☆'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {hiddenResults > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Showing the first {page.results.length} of {page.total} — keep typing to narrow it down.
        </p>
      )}

      {rows.length === 0 && nodes.length === 0 && (
        <div role="status" className="mt-3 rounded-lg border p-3 text-sm">
          <p>Your WorkFlowy tree is empty or hasn&rsquo;t been downloaded yet.</p>
          {refreshButton}
          {refreshMessage && <p className="mt-2 text-muted-foreground">{refreshMessage}</p>}
        </div>
      )}

      {rows.length === 0 && nodes.length > 0 && searching && (
        <div role="status" className="mt-3 rounded-lg border p-3 text-sm">
          <p>No matches for &ldquo;{deferredQuery.trim()}&rdquo;.</p>
          <p className="mt-1 text-muted-foreground">
            The tree may be out of date. Refresh it, or keep the note in its day.
          </p>
          {refreshButton}
          {refreshMessage && <p className="mt-2 text-muted-foreground">{refreshMessage}</p>}
        </div>
      )}

      {rows.length === 0 && nodes.length > 0 && !searching && (
        <p className="mt-3 text-sm text-muted-foreground">
          Type to search. Places you pin or use will show up here.
        </p>
      )}

      {note && (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          {note}
        </p>
      )}

      {error && onRetry && <WriteErrorNotice onRetry={onRetry} onDismiss={onDismissError} />}

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {refreshedAt ? `Tree refreshed ${formatAgo(refreshedAt)}` : 'Tree not refreshed yet'}
        </p>
        <div className="flex gap-1">
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={() => onPick(null)}>
            {currentMirror ? 'Keep as is' : 'Keep in day'} <Kbd>esc</Kbd>
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground [@media(hover:none)]:hidden">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd> move <Kbd>enter</Kbd> select <Kbd>shift</Kbd>
        <Kbd>enter</Kbd> pin
        {onBack && (
          <>
            {' '}
            <Kbd>⌫</Kbd> back
          </>
        )}
      </p>
    </>
  )
}
