import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import { useToday } from '@/shared/hooks/use-today'
import { addDays } from '@/shared/dates'
import type { Destination } from '@/modules/note-filing/types/destination'
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
    /** Types or corrects an entry. Returns `false` if it could not be saved. */
    quickType: (id: string, type: EntryType): boolean =>
      setEntries(quickType(entries, id, type, new Date().toISOString())),
    /** Mirrors (or moves the mirror of) a note. Returns `false` if it could not be saved. */
    fileNote: (id: string, destination: Destination): boolean =>
      setEntries(fileNote(entries, id, destination, new Date().toISOString())),
  }
}
