import type { EntryType } from '../types/entry'
import { stripHtml } from './tags'

/** The types a day sorts its entries under. Archive items stay where they are. */
export type GroupType = Exclude<EntryType, 'archive'>

/** The name the app gives a group bullet it creates in a day. */
export const GROUP_NAMES: Record<GroupType, string> = {
  task: 'Tasks',
  event: 'Events',
  note: 'Notes',
}

// Names typed by hand in WorkFlowy count too, in English or Polish, with or without a colon.
const ALIASES: Record<GroupType, string[]> = {
  task: ['tasks', 'task', 'zadania'],
  event: ['events', 'event', 'wydarzenia', 'zdarzenia'],
  note: ['notes', 'note', 'notatki'],
}

export function isGroupType(type: EntryType): type is GroupType {
  return type !== 'archive'
}

/** The type a day's group bullet stands for, or `null` when the bullet is not a group. */
export function groupTypeFromName(name: string): GroupType | null {
  const text = stripHtml(name).toLowerCase().replace(/:$/, '').trim()
  return (Object.keys(ALIASES) as GroupType[]).find((type) => ALIASES[type].includes(text)) ?? null
}
