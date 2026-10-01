import { addDays } from '@/shared/dates'
import { needsDecision } from '@/modules/review-session/lib/session-logic'
import type { Entry, EntryType } from '@/modules/review-session/types/entry'

export interface DaySummary {
  date: string
  total: number
  /** Entries that still need a decision (untyped, or a task that is still open) */
  waiting: number
}

export function summarizeDay(entries: Entry[], date: string): DaySummary {
  const ofDay = entries.filter((e) => e.date === date)
  return { date, total: ofDay.length, waiting: ofDay.filter(needsDecision).length }
}

/** Open days older than yesterday, oldest first. */
export function backlogDays(entries: Entry[], today: string): DaySummary[] {
  const yesterday = addDays(today, -1)
  const dates = [...new Set(entries.filter((e) => e.date < yesterday).map((e) => e.date))].sort()
  return dates.map((date) => summarizeDay(entries, date)).filter((day) => day.waiting > 0)
}

/** Calm status text — no counts shown as alarms. */
export function dayStatusText(day: DaySummary): string {
  if (day.total === 0) return 'No entries'
  if (day.waiting === 0) return 'Closed'
  return `${day.waiting} ${day.waiting === 1 ? 'entry' : 'entries'} waiting`
}

/** Sets the type of an untyped entry (the app writes the tag to WorkFlowy). */
export function quickType(entries: Entry[], id: string, type: EntryType, now: string): Entry[] {
  return entries.map((e) =>
    e.id === id ? { ...e, type, outcome: type === 'task' ? 'open' : null, updatedAt: now } : e,
  )
}
