import { useMemo } from 'react'
import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import { addDays, todayISO } from '@/shared/dates'
import type { Entry, EntryType } from '@/modules/review-session/types/entry'
import type { ReviewMode, ReviewSession } from '@/modules/review-session/types/session'
import { backlogDays, quickType, summarizeDay } from '../lib/days'

export function useDays() {
  const [entries, setEntries] = useLocalStorage<Entry[]>('entries', [])
  const [sessions] = useLocalStorage<ReviewSession[]>('review-sessions', [])
  const today = useMemo(todayISO, [])
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
    isEmpty: entries.length === 0,
    /** The active session of a mode, if any */
    sessionFor: (mode: ReviewMode) => sessions.find((s) => s.mode === mode) ?? null,
    quickType: (id: string, type: EntryType) =>
      setEntries(quickType(entries, id, type, new Date().toISOString())),
  }
}
