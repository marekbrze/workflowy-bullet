import { generateId } from '@/shared/types'
import type { Entry, EntryType } from '@/modules/review-session/types/entry'
import { GROUP_NAMES, GROUP_TYPES, groupTypeFromName, isGroupType, type GroupType } from '@/modules/review-session/lib/groups'
import { stripHtml, typeFromName } from '@/modules/review-session/lib/tags'
import { refreshLive } from './refresh'
import { getSnapshotState } from './snapshot-state'
import { getLiveApi } from './live'
import { addNodesToIndex, descendantsOf, moveInIndex, removeSubtreeFromIndex, type TreeIndex } from './tree'
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
  /**
   * Turns code block `id` into a text bullet named `name`, in the same place, and puts the code
   * (`code`, its old name) in a new code block as its first child. Returns the new code block's id.
   */
  wrapCodeBlock(id: string, code: string, name: string): Promise<string>
  /** Creates a bullet named `name` (HTML) at the end of the top level. Returns its id. */
  createTopLevel(name: string): Promise<string>
  /** Reverts `wrapCodeBlock`: `id` is a code block holding `code` again, `codeChildId` is gone. */
  unwrapCodeBlock(id: string, code: string, codeChildId: string): Promise<void>
  /**
   * Puts a calendar day's entry under the bullet grouping `type` in that day (`Tasks`, `Events`,
   * `Notes`), made if missing. Returns the parent it was moved from, or `null` when it stays: not a
   * day's entry (a dated bullet elsewhere), already there, or an archive item.
   */
  moveToGroup(id: string, type: EntryType): Promise<string | null>
  /** Moves a bullet to the end of `parentId`. */
  move(id: string, parentId: string): Promise<void>
  /** The bullet grouping `type` in day `date` (`YYYY-MM-DD`), made if missing. Returns its id. */
  groupOf(date: string, type: GroupType): Promise<string>
  /**
   * Gives day `date` its `Tasks`, `Events` and `Notes` (those missing are made) and moves every
   * typed entry of that day under its group. Untyped entries stay: their group is not known yet.
   * Safe to repeat after a failure.
   */
  groupDay(date: string): Promise<{ moved: number; untyped: number }>
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
  wrapCodeBlock: async () => generateId(),
  createTopLevel: async () => generateId(),
  unwrapCodeBlock: async () => {},
  moveToGroup: async () => null,
  move: async () => {},
  groupOf: async (date) => date,
  groupDay: async () => ({ moved: 0, untyped: 0 }),
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
  const findOrCreateGroup = async (index: TreeIndex | null, dayId: string, type: GroupType) => {
    const children = index?.children.get(dayId) ?? (await api.listChildren(dayId))
    const existing = children.find((child) => groupTypeFromName(child.name) === type)
    if (existing) return existing.id
    const name = GROUP_NAMES[type]
    const id = await api.createNode({ parent_id: dayId, name, position: 'bottom' })
    if (index) {
      const now = Math.floor(Date.now() / 1000)
      addNodesToIndex(index, [{
        id, parent_id: dayId, name, note: null, priority: Number.MAX_SAFE_INTEGER, completed: false,
        createdAt: now, modifiedAt: now, completedAt: null,
      }])
    }
    return id
  }

  const dayIdOf = async (index: TreeIndex | null, date: string) => {
    const known = index ? [...index.dayOfNode].find(([, day]) => day === date)?.[0] : undefined
    if (known) return known
    // WorkFlowy makes the day when it is asked for it.
    const day = await api.getNode(date)
    if (index && !index.byId.has(day.id)) {
      addNodesToIndex(index, [day])
      index.dayOfNode.set(day.id, date)
    }
    return day.id
  }

  const moveTo = async (id: string, parentId: string) => {
    await api.moveNode(id, parentId, 'bottom')
    const index = getSnapshotState().index
    if (index) moveInIndex(index, id, parentId)
  }

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
      const remember = (id: string, parentId: string, name: string, priority: number, completed: boolean, layoutMode?: string) =>
        created.push({
          id, parent_id: parentId, name, note: null, priority, completed,
          ...(layoutMode && { data: { layoutMode } }),
          createdAt: now, modifiedAt: now, completedAt: null,
        })

      const rootName = entry.name ?? entry.text
      const rootId = await api.createNode({ parent_id: parent, name: rootName, position: 'bottom' })
      try {
        remember(rootId, parent, rootName, 0, false)
        // Children are created in order, so their order is kept.
        const copyChildren = async (sourceId: string, newParentId: string) => {
          for (const [position, child] of (index?.children.get(sourceId) ?? []).entries()) {
            // Code blocks, headings and the like stay what they were.
            const layoutMode = child.data?.layoutMode
            const childId = await api.createNode({ parent_id: newParentId, name: child.name, position: 'bottom', layoutMode })
            remember(childId, newParentId, child.name, position, child.completed, layoutMode)
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

    wrapCodeBlock: async (id, code, name) => {
      // Created empty and named after: a new bullet's name is read as markdown, an update's is not.
      const codeChildId = await api.createNode({ parent_id: id, name: '', position: 'top', layoutMode: 'code-block' })
      try {
        await api.updateNode(codeChildId, { name: code })
        await api.updateNode(id, { name, layoutMode: 'bullets' })
      } catch (error) {
        await api.deleteNode(codeChildId).catch(() => undefined)
        throw error
      }
      const index = getSnapshotState().index
      const node = index?.byId.get(id)
      if (index && node) {
        const now = Math.floor(Date.now() / 1000)
        index.byId.set(id, { ...node, name, data: { ...node.data, layoutMode: 'bullets' } })
        const child: WorkflowyNode = {
          id: codeChildId, parent_id: id, name: code, note: null, priority: -1, completed: false,
          data: { layoutMode: 'code-block' }, createdAt: now, modifiedAt: now, completedAt: null,
        }
        index.byId.set(codeChildId, child)
        index.children.set(id, [child, ...(index.children.get(id) ?? [])])
      }
      return codeChildId
    },

    createTopLevel: async (name) => {
      // Named after creation, like a code block: a new bullet's name is read as markdown.
      const id = await api.createNode({ parent_id: 'None', name: '', position: 'bottom' })
      try {
        await api.updateNode(id, { name })
      } catch (error) {
        await api.deleteNode(id).catch(() => undefined)
        throw error
      }
      const index = getSnapshotState().index
      if (index) {
        const now = Math.floor(Date.now() / 1000)
        addNodesToIndex(index, [{
          id, parent_id: null, name, note: null, priority: Number.MAX_SAFE_INTEGER, completed: false,
          createdAt: now, modifiedAt: now, completedAt: null,
        }])
      }
      return id
    },

    unwrapCodeBlock: async (id, code, codeChildId) => {
      await api.updateNode(id, { name: code, layoutMode: 'code-block' })
      await api.deleteNode(codeChildId)
      const index = getSnapshotState().index
      if (!index) return
      const node = index.byId.get(id)
      if (node) index.byId.set(id, { ...node, name: code, data: { ...node.data, layoutMode: 'code-block' } })
      removeSubtreeFromIndex(index, codeChildId)
    },

    moveToGroup: async (id, type) => {
      if (!isGroupType(type)) return null
      const index = getSnapshotState().index
      const node = index?.byId.get(id)
      if (!index || !node?.parent_id) return null
      const parent = index.byId.get(node.parent_id)
      // Directly in a day, or in one of the day's groups.
      const dayId = index.dayOfNode.has(node.parent_id)
        ? node.parent_id
        : parent?.parent_id && index.dayOfNode.has(parent.parent_id) && groupTypeFromName(parent.name)
          ? parent.parent_id
          : null
      if (!dayId) return null
      const groupId = await findOrCreateGroup(index, dayId, type)
      if (groupId === node.parent_id) return null
      await moveTo(id, groupId)
      return node.parent_id
    },

    move: moveTo,

    groupOf: async (date, type) => {
      const index = getSnapshotState().index
      return findOrCreateGroup(index, await dayIdOf(index, date), type)
    },

    groupDay: async (date) => {
      // Bullets added since the last download must move too. Best effort: WorkFlowy allows one
      // download a minute, and a tree that recent is good enough.
      await refreshLive().catch(() => undefined)
      const index = getSnapshotState().index
      if (!index) return { moved: 0, untyped: 0 }
      const dayId = await dayIdOf(index, date)
      const groups = {} as Record<GroupType, string>
      for (const type of GROUP_TYPES) groups[type] = await findOrCreateGroup(index, dayId, type)
      // Entries directly in the day, and ones in a group that doesn't match their tag.
      const moves: [string, string][] = []
      let untyped = 0
      for (const child of index.children.get(dayId) ?? []) {
        const inGroup = groupTypeFromName(child.name) !== null
        for (const node of inGroup ? (index.children.get(child.id) ?? []) : [child]) {
          const type = typeFromName(node.name)
          if (!type && !inGroup && (stripHtml(node.name) || index.children.has(node.id))) untyped++
          if (type && isGroupType(type) && node.parent_id !== groups[type]) moves.push([node.id, groups[type]])
        }
      }
      for (const [id, groupId] of moves) await moveTo(id, groupId)
      return { moved: moves.length, untyped }
    },
  }
}

/** The backend for the current connection: the real WorkFlowy, or demo data. */
export function getBackend(): Backend {
  const api = getLiveApi()
  return api ? createLiveBackend(api) : demoBackend
}
