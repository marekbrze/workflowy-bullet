import type { Destination } from './destination'

/** A remembered destination. `pinned` ones are favorites; unpinned ones with `usedAt` are "recent". */
export interface SavedDestination {
  /** Same as `destination.id` */
  id: string
  destination: Destination
  pinned: boolean
  /** Last time a note was mirrored here; `null` if only pinned */
  usedAt: string | null
}

/** The recent list keeps this many unpinned destinations. Pinned ones don't count. */
export const MAX_RECENT = 5
