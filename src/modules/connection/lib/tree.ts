import type { Destination } from '@/modules/note-filing/types/destination'
import type { Entry } from '@/modules/review-session/types/entry'
import { needsDecision } from '@/modules/review-session/lib/session-logic'
import { displayText, outcomeFromName, stripHtml, typeFromName } from '@/modules/review-session/lib/tags'
import { groupTypeFromName, type GroupType } from '@/modules/review-session/lib/groups'
import { addDays } from '@/shared/dates'
import type { WorkflowyNode } from './workflowy-api'

export interface TreeIndex {
  byId: Map<string, WorkflowyNode>
  /** Children of each node, in the order WorkFlowy shows them */
  children: Map<string, WorkflowyNode[]>
  calendarId: string | null
  /** Node id of a calendar day → its date (`YYYY-MM-DD`) */
  dayOfNode: Map<string, string>
}

const pad = (value: string) => value.padStart(2, '0')

/** The first date in a bullet's name: `<time startYear="2026" startMonth="10" startDay="1">…</time>`. */
export function parseTimeTag(name: string): { date: string; whole: boolean } | null {
  const tag = name.match(/<time\b[^>]*>/i)
  if (!tag) return null
  const attr = (key: string) => tag[0].match(new RegExp(`${key}="(\\d+)"`, 'i'))?.[1]
  const year = attr('startYear')
  const month = attr('startMonth')
  const day = attr('startDay')
  if (!year || !month || !day) return null
  const whole = /^\s*<time\b[^>]*>[^<]*<\/time>\s*$/i.test(name)
  return { date: `${year}-${pad(month)}-${pad(day)}`, whole }
}

export function buildIndex(nodes: WorkflowyNode[], calendarId: string | null): TreeIndex {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const children = new Map<string, WorkflowyNode[]>()
  for (const node of nodes) {
    const key = node.parent_id ?? 'ROOT'
    const siblings = children.get(key)
    if (siblings) siblings.push(node)
    else children.set(key, [node])
  }
  for (const siblings of children.values()) siblings.sort((a, b) => a.priority - b.priority)

  // Calendar days: bullets under the calendar whose whole name is one date.
  const dayOfNode = new Map<string, string>()
  const underCalendar = new Map<string, boolean>()
  const isUnderCalendar = (node: WorkflowyNode): boolean => {
    if (!calendarId) return false
    const known = underCalendar.get(node.id)
    if (known !== undefined) return known
    // Walk up iteratively (depth is small, but the tree can be large).
    const path: WorkflowyNode[] = []
    let current: WorkflowyNode | undefined = node
    let result = false
    while (current) {
      const cached = underCalendar.get(current.id)
      if (cached !== undefined) {
        result = cached
        break
      }
      path.push(current)
      if (current.id === calendarId) {
        result = true
        break
      }
      current = current.parent_id ? byId.get(current.parent_id) : undefined
    }
    for (const visited of path) underCalendar.set(visited.id, result)
    return result
  }
  for (const node of nodes) {
    if (node.id === calendarId || !isUnderCalendar(node)) continue
    const time = parseTimeTag(node.name)
    if (time?.whole && !dayOfNode.has(node.parent_id ?? '')) dayOfNode.set(node.id, time.date)
  }
  return { byId, children, calendarId, dayOfNode }
}

const toIso = (seconds: number) => new Date(seconds * 1000).toISOString()

export interface MirrorRecord {
  destination: Destination
  mirrorItemId: string
}

function entryFromNode(
  node: WorkflowyNode,
  date: string,
  index: TreeIndex,
  mirrors: Record<string, MirrorRecord>,
  group?: GroupType,
): Entry {
  const type = typeFromName(node.name)
  const mirror = mirrors[node.id]
  return {
    id: node.id,
    createdAt: toIso(node.createdAt),
    updatedAt: toIso(node.modifiedAt),
    text: displayText(node.name),
    name: node.name,
    children: (index.children.get(node.id) ?? []).map((child) => stripHtml(child.name)).filter(Boolean),
    date,
    type,
    ...(group && { group }),
    outcome: type === 'task' ? outcomeFromName(node.name, node.completed) : null,
    completed: node.completed,
    mirroredTo: mirror?.destination ?? null,
    ...(node.data?.layoutMode === 'code-block' && { codeBlock: true }),
    mirrorItemId: mirror?.mirrorItemId,
  }
}

/**
 * The entries the app works with: the bullets of each calendar day, plus bullets dated anywhere
 * else in the tree. Old entries that need no decision are left out — the app only ever shows
 * yesterday, today and whatever is still open.
 */
export function deriveEntries(
  index: TreeIndex,
  today: string,
  mirrors: Record<string, MirrorRecord> = {},
): Entry[] {
  const yesterday = addDays(today, -1)
  const entries: Entry[] = []
  const seen = new Set<string>()
  const add = (entry: Entry) => {
    if (seen.has(entry.id)) return
    seen.add(entry.id)
    // Blank bullets are WorkFlowy's empty lines, not something to decide about.
    if (!entry.text && entry.children.length === 0) return
    if (entry.date >= yesterday || needsDecision(entry)) entries.push(entry)
  }

  for (const [dayNodeId, date] of index.dayOfNode) {
    for (const child of index.children.get(dayNodeId) ?? []) {
      // A group bullet (`Tasks`, `Events`, `Notes`) is not an entry: its children are.
      const group = groupTypeFromName(child.name)
      if (group) {
        for (const grouped of index.children.get(child.id) ?? []) {
          add(entryFromNode(grouped, date, index, mirrors, group))
        }
      } else {
        add(entryFromNode(child, date, index, mirrors))
      }
    }
  }
  // Dated bullets anywhere else.
  for (const node of index.byId.values()) {
    if (index.dayOfNode.has(node.id) || seen.has(node.id)) continue
    const time = parseTimeTag(node.name)
    if (!time) continue
    if (isInCalendar(index, node)) continue
    add(entryFromNode(node, time.date, index, mirrors))
  }
  return entries
}

function isInCalendar(index: TreeIndex, node: WorkflowyNode): boolean {
  if (!index.calendarId) return false
  for (let current: WorkflowyNode | undefined = node; current; current = current.parent_id ? index.byId.get(current.parent_id) : undefined) {
    if (current.id === index.calendarId) return true
  }
  return false
}

/** Every bullet a note can be mirrored under, with the path that tells same-named ones apart. */
export function buildDestinations(index: TreeIndex): Destination[] {
  const names = new Map<string, string>()
  const nameOf = (node: WorkflowyNode) => {
    let value = names.get(node.id)
    if (value === undefined) {
      value = stripHtml(node.name)
      names.set(node.id, value)
    }
    return value
  }
  const result: Destination[] = []
  for (const node of index.byId.values()) {
    if (node.completed || node.id === index.calendarId || isInCalendar(index, node)) continue
    const name = nameOf(node)
    if (!name) continue
    const path: string[] = []
    for (let parent = node.parent_id ? index.byId.get(node.parent_id) : undefined; parent; parent = parent.parent_id ? index.byId.get(parent.parent_id) : undefined) {
      const label = nameOf(parent)
      if (label) path.unshift(label)
    }
    result.push({ id: node.id, name, path, childCount: index.children.get(node.id)?.length ?? 0 })
  }
  return result
}

/** Adds freshly created bullets to the in-memory tree so a later copy still sees what they contain. */
export function addNodesToIndex(index: TreeIndex, nodes: WorkflowyNode[]): void {
  for (const node of nodes) {
    index.byId.set(node.id, node)
    const key = node.parent_id ?? 'ROOT'
    const siblings = index.children.get(key)
    if (siblings) siblings.push(node)
    else index.children.set(key, [node])
  }
}

/** Puts a bullet at the end of `parentId` in the in-memory tree (after it was moved in WorkFlowy). */
export function moveInIndex(index: TreeIndex, id: string, parentId: string): void {
  const node = index.byId.get(id)
  if (!node) return
  const old = index.children.get(node.parent_id ?? 'ROOT')
  if (old) {
    const at = old.findIndex((s) => s.id === id)
    if (at >= 0) old.splice(at, 1)
  }
  const siblings = index.children.get(parentId) ?? []
  const moved = { ...node, parent_id: parentId, priority: (siblings.at(-1)?.priority ?? 0) + 1 }
  index.byId.set(id, moved)
  index.children.set(parentId, [...siblings, moved])
}

/** Forgets a bullet and everything under it (after it was deleted in WorkFlowy). */
export function removeSubtreeFromIndex(index: TreeIndex, id: string): void {
  const node = index.byId.get(id)
  if (!node) return
  const stack = [id]
  while (stack.length) {
    const current = stack.pop()!
    for (const child of index.children.get(current) ?? []) stack.push(child.id)
    index.byId.delete(current)
    index.children.delete(current)
  }
  const siblings = index.children.get(node.parent_id ?? 'ROOT')
  if (siblings) {
    const at = siblings.findIndex((s) => s.id === id)
    if (at >= 0) siblings.splice(at, 1)
  }
}

/** All bullets under `id` (not including it), parents before children. */
export function descendantsOf(index: TreeIndex, id: string): WorkflowyNode[] {
  const result: WorkflowyNode[] = []
  const walk = (parentId: string) => {
    for (const child of index.children.get(parentId) ?? []) {
      result.push(child)
      walk(child.id)
    }
  }
  walk(id)
  return result
}
