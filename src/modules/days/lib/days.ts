import { addDays } from '@/shared/dates'
import { needsDecision, typeEntry } from '@/modules/review-session/lib/session-logic'
import type { Destination } from '@/modules/note-filing/types/destination'
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

/** Sets or corrects the type of an entry (the app writes the tag to WorkFlowy). Same rule as the session card. */
export function quickType(entries: Entry[], id: string, type: EntryType, now: string, wrapperName?: string): Entry[] {
  return entries.map((e) => (e.id === id ? typeEntry(e, type, now, wrapperName) : e))
}

/** Files a note: sets (or moves) its mirror. */
export function fileNote(
  entries: Entry[],
  id: string,
  destination: Destination,
  now: string,
  mirrorItemId?: string,
): Entry[] {
  return entries.map((e) =>
    e.id === id ? { ...e, mirroredTo: destination, mirrorItemId, updatedAt: now } : e,
  )
}

/** Open tasks that were rolled over to tomorrow. */
export function tomorrowTaskCount(entries: Entry[], today: string): number {
  const tomorrow = addDays(today, 1)
  return entries.filter((e) => e.date === tomorrow && e.type === 'task' && e.outcome === 'open').length
}

export interface EntrySection {
  key: EntryType | 'untyped'
  label: string
  entries: Entry[]
}

const SECTIONS: { key: EntrySection['key']; label: string }[] = [
  { key: 'untyped', label: 'To type' },
  { key: 'task', label: 'Tasks' },
  { key: 'event', label: 'Events' },
  { key: 'note', label: 'Notes' },
  { key: 'archive', label: 'Archive' },
]

/**
 * A day's entries under the same bullets as in WorkFlowy: by type, and an untagged entry under
 * the group it sits in (it gets that tag in a review). Empty sections are left out; order within
 * a section is kept.
 */
export function sectionEntries(entries: Entry[]): EntrySection[] {
  const keyOf = (e: Entry): EntrySection['key'] => e.type ?? e.group ?? 'untyped'
  return SECTIONS.map(({ key, label }) => ({ key, label, entries: entries.filter((e) => keyOf(e) === key) })).filter(
    (section) => section.entries.length > 0,
  )
}

/** Show only the first `limit` items until the user asks for all. */
export function limitItems<T>(items: T[], limit: number, showAll: boolean): T[] {
  return showAll ? items : items.slice(0, limit)
}
