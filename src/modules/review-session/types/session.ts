import type { BaseEntity } from '@/shared/types'
import type { Entry, EntryType } from './entry'

export type ReviewMode = 'today' | 'yesterday' | 'backlog'

export const REVIEW_MODES: ReviewMode[] = ['today', 'yesterday', 'backlog']

export type DecisionKind =
  | 'classify'
  | 'done'
  | 'roll-over'
  | 'irrelevant'
  | 'leave-open'
  | 'keep-in-day'
  | 'mirror'
  | 'delete'

/** One recorded processing step, with enough information to undo it. */
export interface Decision {
  id: string
  kind: DecisionKind
  entryId: string
  /** The entry as it was before the decision */
  before: Entry
  /** Set by `classify` */
  toType?: EntryType
  /** Roll-over copy created by the decision */
  createdEntryId?: string
  at: string
}

export interface ReviewSession extends BaseEntity {
  mode: ReviewMode
  /** Entry ids still to process; the first one is the current entry */
  queue: string[]
  /** Queue length when the session started */
  total: number
  decisions: Decision[]
}
