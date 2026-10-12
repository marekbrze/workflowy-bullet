import type { BaseEntity } from '@/shared/types'
import type { Destination } from '@/modules/note-filing/types/destination'

/** `archive`: kept for now, to be removed in bulk later (Connection → Archive → Delete all archived). */
export type EntryType = 'task' | 'note' | 'event' | 'archive'

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
  /**
   * A WorkFlowy code block. Tags never go into code: typing one turns the bullet into a named
   * text bullet with the code in a new code block under it.
   */
  codeBlock?: boolean
  /** The id of the mirror the app created (needed to remove or move it) */
  mirrorItemId?: string
}
