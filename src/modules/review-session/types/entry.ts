import type { BaseEntity } from '@/shared/types'
import type { Destination } from '@/modules/note-filing/types/destination'

export type EntryType = 'task' | 'note' | 'event'

/** All three non-open outcomes are "completed" in WorkFlowy. */
export type TaskOutcome = 'open' | 'done' | 'migrated' | 'irrelevant'

/** A top-level WorkFlowy bullet belonging to a day (mocked in LocalStorage). */
export interface Entry extends BaseEntity {
  text: string
  /** Child bullets — content that travels with the entry */
  children: string[]
  /** Day the entry belongs to, `YYYY-MM-DD` */
  date: string
  /** `null` = untyped */
  type: EntryType | null
  /** Only set for tasks */
  outcome: TaskOutcome | null
  mirroredTo: Destination | null
}
