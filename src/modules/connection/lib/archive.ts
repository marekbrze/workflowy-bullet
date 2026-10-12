import { writeStorage } from '@/shared/lib/storage'
import { todayISO } from '@/shared/dates'
import { hasTag } from '@/modules/review-session/lib/tags'
import { loadMirrors } from './mirrors'
import { getBackend, type Backend } from './backend'
import { saveSnapshot } from './snapshot-store'
import { getSnapshotState } from './snapshot-state'
import { deriveEntries, type TreeIndex } from './tree'
import type { WorkflowyNode } from './workflowy-api'

/**
 * Every bullet tagged `#archive`. A tagged bullet inside another tagged one is left out:
 * deleting the outer one takes it along.
 */
export function findArchived(index: TreeIndex): WorkflowyNode[] {
  const tagged = (node: WorkflowyNode) => hasTag(node.name, 'archive')
  const result: WorkflowyNode[] = []
  for (const node of index.byId.values()) {
    if (!tagged(node)) continue
    let nested = false
    for (let parent = node.parent_id ? index.byId.get(node.parent_id) : undefined; parent; parent = parent.parent_id ? index.byId.get(parent.parent_id) : undefined) {
      if (tagged(parent)) {
        nested = true
        break
      }
    }
    if (!nested) result.push(node)
  }
  return result
}

export interface PurgeResult {
  deleted: number
  failed: number
}

/** Permanently deletes every `#archive` bullet (with what is under it) from WorkFlowy. */
export async function purgeArchive(
  index: TreeIndex,
  backend: Backend = getBackend(),
  /** Called before each deletion: how many are done so far, how many there are, and what is next. */
  onProgress?: (done: number, total: number, current: WorkflowyNode) => void,
): Promise<PurgeResult> {
  const targets = findArchived(index)
  let deleted = 0
  let failed = 0
  for (const [position, node] of targets.entries()) {
    onProgress?.(position, targets.length, node)
    try {
      await backend.deleteNode(node.id)
      deleted++
    } catch {
      failed++
    }
  }
  if (deleted > 0) {
    // Keep the stored snapshot and the entries in step with what is left.
    const state = getSnapshotState()
    if (state.refreshedAt) {
      await saveSnapshot({ nodes: [...index.byId.values()], calendarId: index.calendarId, refreshedAt: state.refreshedAt })
    }
    writeStorage('entries', deriveEntries(index, todayISO(), loadMirrors()))
  }
  return { deleted, failed }
}
