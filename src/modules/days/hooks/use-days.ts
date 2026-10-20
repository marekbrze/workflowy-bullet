import { ApiError } from '@/modules/connection/lib/workflowy-api'
import { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import { useToday } from '@/shared/hooks/use-today'
import { addDays } from '@/shared/dates'
import { AuthError, reportAuthFailure } from '@/modules/connection/lib/auth'
import { getBackend } from '@/modules/connection/lib/backend'
import { isLive } from '@/modules/connection/lib/live'
import type { Destination } from '@/modules/note-filing/types/destination'
import { remoteClassify, remoteNote } from '@/modules/review-session/lib/remote'
import { newEntryIds, reconcileQueue } from '@/modules/review-session/lib/session-logic'
import type { Entry, EntryType } from '@/modules/review-session/types/entry'
import type { ReviewMode, ReviewSession } from '@/modules/review-session/types/session'
import { backlogDays, fileNote, quickType, summarizeDay, tomorrowTaskCount } from '../lib/days'

export function useDays() {
  const [entries, setEntries, , entriesStatus] = useLocalStorage<Entry[]>('entries', [])
  const [sessions] = useLocalStorage<ReviewSession[]>('review-sessions', [])
  // Stays current at midnight and when the tab regains focus.
  const today = useToday()
  const yesterday = addDays(today, -1)

  // A change is sent to WorkFlowy before it is kept here, so one can be in flight; its row waits.
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [grouping, setGrouping] = useState(false)
  const [groupNotice, setGroupNotice] = useState<string | null>(null)
  // The freshest stored entries: the tree can be refreshed while a change is on its way.
  const latest = useRef(entries)
  useEffect(() => {
    latest.current = entries
  })

  const change = async (
    id: string,
    remote: (entry: Entry) => Promise<unknown>,
    apply: (entries: Entry[]) => Entry[],
  ): Promise<boolean> => {
    const entry = latest.current.find((e) => e.id === id)
    if (!entry || busyId !== null) return false
    setBusyId(id)
    setError(null)
    try {
      await remote(entry)
      return setEntries(apply(latest.current))
    } catch (e) {
      // The key stopped working: the connection flow takes over. Anything else is shown here.
      if (e instanceof AuthError) reportAuthFailure()
      else if (e instanceof ApiError) setError(`That didn't reach WorkFlowy (${e.message}). Nothing was changed.`)
      else setError("That didn't reach WorkFlowy. Nothing was changed.")
      return false
    } finally {
      setBusyId(null)
    }
  }

  const todayEntries = entries
    .filter((e) => e.date === today)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const backlog = backlogDays(entries, today)

  return {
    today,
    yesterday,
    yesterdayStatus: summarizeDay(entries, yesterday),
    todayStatus: summarizeDay(entries, today),
    todayEntries,
    backlog,
    tomorrowCount: tomorrowTaskCount(entries, today),
    isEmpty: entries.length === 0,
    /** The saved entries could not be read; a copy was kept */
    entriesUnreadable: entriesStatus.unreadable,
    startFresh: entriesStatus.startFresh,
    /**
     * Entries left in the active session of a mode, as the session will really show them:
     * the stored queue minus what is gone or settled, plus entries that arrived since. `null` = no session.
     */
    remaining: (mode: ReviewMode): number | null => {
      const session = sessions.find((s) => s.mode === mode)
      if (!session) return null
      return (
        reconcileQueue(entries, session.queue).length + newEntryIds(session, entries, today).length
      )
    },
    /** The entry whose change is on its way to WorkFlowy, if any */
    busyId,
    /** What went wrong with the last change, or `null` */
    error,
    clearError: () => setError(null),
    /** Types or corrects an entry. Returns `false` if it could not be saved. */
    quickType: (id: string, type: EntryType, wrapperName?: string): Promise<boolean> =>
      change(
        id,
        (entry) => remoteClassify(getBackend(), entry, type, wrapperName),
        (all) => quickType(all, id, type, new Date().toISOString(), wrapperName),
      ),
    /** Only the real WorkFlowy has a day to put groups in */
    canGroup: isLive(),
    /** Today's groups are being made / entries moved */
    grouping,
    /** What the last grouping did, or `null` */
    groupNotice,
    /** Adds `Tasks`, `Events`, `Notes` to today in WorkFlowy and moves typed entries under them. */
    groupToday: async (): Promise<void> => {
      if (grouping || busyId !== null) return
      setGrouping(true)
      setError(null)
      setGroupNotice(null)
      try {
        const moved = await getBackend().groupDay(today)
        setGroupNotice(
          moved === 0
            ? 'Today has its groups; every typed entry is already under one.'
            : `Moved ${moved} ${moved === 1 ? 'entry' : 'entries'} under ${moved === 1 ? 'its group' : 'their groups'}.`,
        )
      } catch (e) {
        // Moves done so far stay; grouping again finishes the rest.
        if (e instanceof AuthError) reportAuthFailure()
        else setError(`Grouping stopped partway${e instanceof ApiError ? ` (${e.message})` : ''}. Try again to finish.`)
      } finally {
        setGrouping(false)
      }
    },
    /** Mirrors (or moves the mirror of) a note. Returns `false` if it could not be saved. */
    fileNote: (id: string, destination: Destination): Promise<boolean> => {
      let mirrorItemId: string | undefined
      let filedUnder = destination
      return change(
        id,
        async (entry) => {
          const result = await remoteNote(getBackend(), entry, destination)
          mirrorItemId = result.mirrorItemId
          filedUnder = result.createdDestination ?? destination
        },
        (all) => fileNote(all, id, filedUnder, new Date().toISOString(), mirrorItemId),
      )
    },
  }
}
