import { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import { useToday } from '@/shared/hooks/use-today'
import { addDays } from '@/shared/dates'
import { AuthError, reportAuthFailure } from '@/modules/connection/lib/auth'
import { getBackend } from '@/modules/connection/lib/backend'
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
    quickType: (id: string, type: EntryType): Promise<boolean> =>
      change(
        id,
        (entry) => remoteClassify(getBackend(), entry, type),
        (all) => quickType(all, id, type, new Date().toISOString()),
      ),
    /** Mirrors (or moves the mirror of) a note. Returns `false` if it could not be saved. */
    fileNote: (id: string, destination: Destination): Promise<boolean> => {
      let mirrorItemId: string | undefined
      return change(
        id,
        async (entry) => {
          mirrorItemId = (await remoteNote(getBackend(), entry, destination)).mirrorItemId
        },
        (all) => fileNote(all, id, destination, new Date().toISOString(), mirrorItemId),
      )
    },
  }
}
