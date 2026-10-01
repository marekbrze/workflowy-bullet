import { generateId } from '@/shared/types'
import type { Entry } from '@/modules/review-session/types/entry'
import { getSnapshotState } from './snapshot-state'
import { getLiveApi } from './live'
import { addNodesToIndex, descendantsOf, removeSubtreeFromIndex } from './tree'
import type { WorkflowyApi, WorkflowyNode } from './workflowy-api'

/** Everything the app changes in WorkFlowy. One real implementation, one for demo data. */
export interface Backend {
  setName(id: string, name: string): Promise<void>
  complete(id: string): Promise<void>
  uncomplete(id: string): Promise<void>
  /**
   * Copies a bullet and everything under it to the end of `parent` (a node id, or a date
   * `YYYY-MM-DD` for a calendar day). Returns the id of the new bullet.
   */
  copyTo(entry: Entry, parent: string): Promise<string>
  /** Deletes a bullet and everything under it. */
  deleteNode(id: string): Promise<void>
  /** Mirrors a bullet under a destination. Returns the id of the mirror. */
  mirror(entryId: string, destinationId: string): Promise<string>
  removeMirror(mirrorItemId: string): Promise<void>
}

/** Demo data is never written anywhere. */
export const demoBackend: Backend = {
  setName: async () => {},
  complete: async () => {},
  uncomplete: async () => {},
  copyTo: async () => generateId(),
  deleteNode: async () => {},
  mirror: async () => generateId(),
  removeMirror: async () => {},
}

/** Past this many bullets a copy would take too many requests; better to say so than to stall. */
export const MAX_COPY_NODES = 200

export class CopyTooLargeError extends Error {
  constructor() {
    super(`This entry holds more than ${MAX_COPY_NODES} sub-items, which is too many to copy.`)
    this.name = 'CopyTooLargeError'
  }
}

export function createLiveBackend(api: WorkflowyApi): Backend {
  return {
    setName: async (id, name) => {
      await api.updateNode(id, { name })
    },
    complete: async (id) => {
      await api.completeNode(id)
    },
    uncomplete: async (id) => {
      await api.uncompleteNode(id)
    },

    copyTo: async (entry, parent) => {
      const index = getSnapshotState().index
      const source = index?.byId.get(entry.id)
      const below = index && source ? descendantsOf(index, entry.id) : []
      if (below.length > MAX_COPY_NODES) throw new CopyTooLargeError()

      const created: WorkflowyNode[] = []
      const now = Math.floor(Date.now() / 1000)
      const remember = (id: string, parentId: string, name: string, priority: number, completed: boolean) =>
        created.push({
          id, parent_id: parentId, name, note: null, priority, completed,
          createdAt: now, modifiedAt: now, completedAt: null,
        })

      const rootName = entry.name ?? entry.text
      const rootId = await api.createNode({ parent_id: parent, name: rootName, position: 'bottom' })
      try {
        remember(rootId, parent, rootName, 0, false)
        // Children are created in order, so their order is kept.
        const copyChildren = async (sourceId: string, newParentId: string) => {
          for (const [position, child] of (index?.children.get(sourceId) ?? []).entries()) {
            const childId = await api.createNode({ parent_id: newParentId, name: child.name, position: 'bottom' })
            remember(childId, newParentId, child.name, position, child.completed)
            if (child.completed) await api.completeNode(childId)
            await copyChildren(child.id, childId)
          }
        }
        if (source) await copyChildren(source.id, rootId)
      } catch (error) {
        // Never leave half a copy behind.
        await api.deleteNode(rootId).catch(() => undefined)
        throw error
      }
      // The new bullets join the in-memory tree, so copying the copy later still finds its children.
      if (index) addNodesToIndex(index, created)
      return rootId
    },

    deleteNode: async (id) => {
      await api.deleteNode(id)
      const index = getSnapshotState().index
      if (index) removeSubtreeFromIndex(index, id)
    },
    mirror: (entryId, destinationId) => api.mirrorNode(entryId, destinationId),
    removeMirror: async (mirrorItemId) => {
      await api.deleteMirror(mirrorItemId)
    },
  }
}

/** The backend for the current connection: the real WorkFlowy, or demo data. */
export function getBackend(): Backend {
  const api = getLiveApi()
  return api ? createLiveBackend(api) : demoBackend
}
