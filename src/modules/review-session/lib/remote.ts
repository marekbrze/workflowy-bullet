import { addTag, escapeHtml, setTypeTag } from './tags'
import type { Decision, ReviewMode } from '../types/session'
import type { Entry, EntryType } from '../types/entry'
import type { Destination } from '@/modules/note-filing/types/destination'
import type { Backend } from '@/modules/connection/lib/backend'
import { saveMirror } from '@/modules/connection/lib/mirrors'
import { rollOverTarget, type TaskDecision } from './session-logic'

/** Ids WorkFlowy handed out while the decision was applied there. */
export interface RemoteResult {
  /** The rolled-over copy */
  copyId?: string
  /** The mirror that was created */
  mirrorItemId?: string
  /** The code block made when a code block was named and typed */
  codeChildId?: string
}

/**
 * What each decision does in WorkFlowy. The pure logic in `session-logic.ts` decides what the
 * entry *becomes*; these functions make WorkFlowy match. Entries from demo data carry no `name`
 * and are never written (the demo backend ignores the calls).
 */

export async function remoteClassify(
  backend: Backend,
  before: Entry,
  type: EntryType,
  /** Required for a code block: the name of the text bullet it becomes */
  wrapperName?: string,
): Promise<RemoteResult> {
  if (before.name === undefined) return {}
  if (before.codeBlock) {
    if (!wrapperName?.trim()) throw new Error('A code block needs a name before it can be typed.')
    const name = setTypeTag(escapeHtml(wrapperName.trim()), type)
    return { codeChildId: await backend.wrapCodeBlock(before.id, before.name, name) }
  }
  await backend.setName(before.id, setTypeTag(before.name, type))
  return {}
}

export async function remoteTask(
  backend: Backend,
  before: Entry,
  kind: TaskDecision,
  mode: ReviewMode,
  today: string,
): Promise<RemoteResult> {
  if (kind === 'leave-open') return {}
  if (kind === 'done') {
    await backend.complete(before.id)
    return {}
  }
  if (kind === 'irrelevant') {
    if (before.name !== undefined) await backend.setName(before.id, addTag(before.name, 'irrelevant'))
    await backend.complete(before.id)
    return {}
  }
  // Roll over: the copy comes first, so a failure can never lose the task.
  const copyId = await backend.copyTo(before, rollOverTarget(mode, today))
  try {
    if (before.name !== undefined) await backend.setName(before.id, addTag(before.name, 'migrated'))
    await backend.complete(before.id)
  } catch (error) {
    // Marking the original failed: take the copy back so a retry does not duplicate it.
    await backend.deleteNode(copyId).catch(() => undefined)
    throw error
  }
  return { copyId }
}

/** `destination === null` keeps the note as it is. A destination moves the note's mirror there. */
export async function remoteNote(
  backend: Backend,
  before: Entry,
  destination: Destination | null,
): Promise<RemoteResult> {
  if (!destination) return {}
  // The new mirror first, then the old one goes: a failure in between leaves two, never none.
  const mirrorItemId = await backend.mirror(before.id, destination.id)
  if (before.mirrorItemId) await backend.removeMirror(before.mirrorItemId).catch(() => undefined)
  saveMirror(before.id, { destination, mirrorItemId })
  return { mirrorItemId }
}

export async function remoteDelete(backend: Backend, before: Entry): Promise<RemoteResult> {
  await backend.deleteNode(before.id)
  return {}
}

/** Puts WorkFlowy back the way it was before `decision`. */
export async function remoteUndo(backend: Backend, decision: Decision): Promise<void> {
  const { before } = decision
  const restoreName = async () => {
    if (before.name !== undefined) await backend.setName(before.id, before.name)
  }
  switch (decision.kind) {
    case 'classify':
      if (decision.codeChildId && before.name !== undefined) {
        await backend.unwrapCodeBlock(before.id, before.name, decision.codeChildId)
      } else {
        await restoreName()
      }
      break
    case 'done':
      await backend.uncomplete(before.id)
      break
    case 'irrelevant':
      await restoreName()
      await backend.uncomplete(before.id)
      break
    case 'roll-over':
      await restoreName()
      await backend.uncomplete(before.id)
      if (decision.createdEntryId) await backend.deleteNode(decision.createdEntryId)
      break
    case 'mirror': {
      if (decision.mirrorItemId) await backend.removeMirror(decision.mirrorItemId)
      // A moved mirror: the one it replaced comes back.
      if (before.mirroredTo) {
        const restored = await backend.mirror(before.id, before.mirroredTo.id)
        saveMirror(before.id, { destination: before.mirroredTo, mirrorItemId: restored })
      } else {
        saveMirror(before.id, null)
      }
      break
    }
    case 'leave-open':
    case 'keep-in-day':
    case 'delete':
      break
  }
}
