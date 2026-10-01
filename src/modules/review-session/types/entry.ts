import type { BaseEntity } from '@/shared/types'
import type { Destination } from '@/modules/note-filing/types/destination'

export type EntryType = 'task' | 'note' | 'event'

/** All three non-open outcomes are "completed" in WorkFlowy. */
export type TaskOutcome = 'open' | 'done' | 'migrated' | 'irrelevant'

/** A top-level WorkFlowy bullet belonging to a day (mocked in LocalStorage). */
export interface Entry extends BaseEntity {
  /** What the card shows: plain text, without the tags the app manages */
  text: string
  /**
   * The bullet's name exactly as WorkFlowy holds it (inline HTML, tags included). Absent for demo
   * data, which is never written back.
   */
  name?: string
  /** Child bullets — content that travels with the entry */
  children: string[]
  /** Day the entry belongs to, `YYYY-MM-DD` */
  date: string
  /** `null` = untyped */
  type: EntryType | null
  /** Only set for tasks */
  outcome: TaskOutcome | null
  /** Completed in WorkFlowy. Tasks that are done/migrated/irrelevant are completed; an untyped entry can be too. */
  completed: boolean
  mirroredTo: Destination | null
  /** The id of the mirror the app created (needed to remove or move it) */
  mirrorItemId?: string
}
