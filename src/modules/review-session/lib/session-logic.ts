import { addDays } from '@/shared/dates'
import { generateId } from '@/shared/types'
import type { Destination } from '@/modules/note-filing/types/destination'
import type { Entry, EntryType } from '../types/entry'
import type { Decision, DecisionKind, ReviewMode, ReviewSession } from '../types/session'

export interface SessionState {
  entries: Entry[]
  queue: string[]
  decisions: Decision[]
}

/** What the card asks the user for right now. */
export type Step = 'classify' | 'task' | 'note'

export function needsDecision(entry: Entry): boolean {
  return entry.type === null || (entry.type === 'task' && entry.outcome === 'open')
}

/** Entries a new session of `mode` has to process, oldest day first. */
export function buildQueue(entries: Entry[], mode: ReviewMode, today: string): string[] {
  const yesterday = addDays(today, -1)
  const inScope = (e: Entry) => {
    if (mode === 'today') return e.date === today
    if (mode === 'yesterday') return e.date === yesterday
    return e.date < yesterday
  }
  return entries
    .filter((e) => inScope(e) && needsDecision(e))
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    .map((e) => e.id)
}

/** `null` = nothing is left to decide for this entry (an event, or a completed task). */
export function getStep(entry: Entry): Step | null {
  if (entry.type === null) return 'classify'
  if (entry.type === 'note') return 'note'
  if (entry.type === 'task' && entry.outcome === 'open') return 'task'
  return null
}

/**
 * The queue as it really is now: entries that were deleted, or that no longer need a
 * decision (typed as an event elsewhere, completed, ...), are dropped.
 */
export function reconcileQueue(entries: Entry[], queue: string[]): string[] {
  const byId = new Map(entries.map((e) => [e.id, e]))
  return queue.filter((id) => {
    const entry = byId.get(id)
    return entry !== undefined && getStep(entry) !== null
  })
}

/** Entries that entered the session's scope after it started (it only ever adds, never re-adds). */
export function newEntryIds(
  session: Pick<ReviewSession, 'mode' | 'queue' | 'knownIds' | 'decisions'>,
  entries: Entry[],
  today: string,
): string[] {
  const known = new Set([
    ...(session.knownIds ?? []),
    ...session.queue,
    ...session.decisions.map((d) => d.entryId),
  ])
  return buildQueue(entries, session.mode, today).filter((id) => !known.has(id))
}

export function rollOverTarget(mode: ReviewMode, today: string): string {
  return mode === 'today' ? addDays(today, 1) : today
}

function lastUndoableIndex(decisions: Decision[]): number {
  for (let i = decisions.length - 1; i >= 0; i--) {
    if (decisions[i].kind !== 'delete') return i
  }
  return -1
}

export function canUndo(decisions: Decision[]): boolean {
  return lastUndoableIndex(decisions) !== -1
}

const DECISION_LABELS: Record<DecisionKind, string> = {
  classify: 'typed',
  done: 'marked done',
  'roll-over': 'rolled over',
  irrelevant: 'marked irrelevant',
  'leave-open': 'left open',
  'keep-in-day': 'kept in day',
  mirror: 'mirrored',
  delete: 'deleted',
}

/** What Undo would revert, e.g. "marked done". `null` when there is nothing to undo. */
export function describeNextUndo(decisions: Decision[]): string | null {
  const index = lastUndoableIndex(decisions)
  if (index === -1) return null
  const d = decisions[index]
  return d.kind === 'classify' && d.toType ? `typed as ${d.toType}` : DECISION_LABELS[d.kind]
}

/** A roll-over copy that was processed or edited since cannot be removed without losing that work. */
export function undoBlockedReason(state: SessionState): string | null {
  const index = lastUndoableIndex(state.decisions)
  if (index === -1) return null
  const copyId = state.decisions[index].createdEntryId
  if (!copyId) return null
  const copy = state.entries.find((e) => e.id === copyId)
  if (!copy) return null
  const untouched = copy.type === 'task' && copy.outcome === 'open' && copy.updatedAt === copy.createdAt
  return untouched
    ? null
    : "The copy of this task has changed since, so this can't be undone here. Undo it from its day instead."
}

function findEntry(entries: Entry[], id: string): Entry {
  const entry = entries.find((e) => e.id === id)
  if (!entry) throw new Error(`Entry "${id}" not found`)
  return entry
}

function patchEntry(entries: Entry[], id: string, patch: Partial<Entry>, now: string): Entry[] {
  return entries.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: now } : e))
}

function without(queue: string[], id: string): string[] {
  return queue.filter((q) => q !== id)
}

function decision(
  kind: DecisionKind,
  before: Entry,
  now: string,
  extra: Partial<Decision> = {},
): Decision {
  return { id: generateId(), kind, entryId: before.id, before, at: now, ...extra }
}

/** Sets the type of an entry — the first classification, or a correction (Change type). */
export function classify(
  state: SessionState,
  entryId: string,
  type: EntryType,
  now: string,
): SessionState {
  const before = findEntry(state.entries, entryId)
  // An entry already completed in WorkFlowy becomes a done task; it is never re-opened.
  const outcome = type === 'task' ? (before.completed === true ? 'done' : 'open') : null
  const patch: Partial<Entry> = { type, outcome }
  return {
    entries: patchEntry(state.entries, entryId, patch, now),
    // A task still needs its fate and a note still needs a destination; an event is done,
    // and so is a completed task — `reconcileQueue` drops both.
    queue: type === 'event' ? without(state.queue, entryId) : state.queue,
    decisions: [...state.decisions, decision('classify', before, now, { toType: type })],
  }
}

export type TaskDecision = 'done' | 'roll-over' | 'irrelevant' | 'leave-open'

export function decideTask(
  state: SessionState,
  entryId: string,
  kind: TaskDecision,
  mode: ReviewMode,
  today: string,
  now: string,
): SessionState {
  const before = findEntry(state.entries, entryId)
  let entries = state.entries
  let createdEntryId: string | undefined

  if (kind === 'done') {
    entries = patchEntry(entries, entryId, { outcome: 'done', completed: true }, now)
  }
  if (kind === 'irrelevant') {
    entries = patchEntry(entries, entryId, { outcome: 'irrelevant', completed: true }, now)
  }
  if (kind === 'roll-over') {
    // The original stays in its day as history; an independent copy goes to the target day.
    const copy: Entry = {
      ...before,
      id: generateId(),
      date: rollOverTarget(mode, today),
      type: 'task',
      outcome: 'open',
      completed: false,
      mirroredTo: null,
      createdAt: now,
      updatedAt: now,
    }
    createdEntryId = copy.id
    entries = [
      ...patchEntry(entries, entryId, { outcome: 'migrated', completed: true }, now),
      copy,
    ]
  }

  return {
    entries,
    queue: without(state.queue, entryId),
    decisions: [...state.decisions, decision(kind, before, now, { createdEntryId })],
  }
}

/** `destination === null` keeps the note in its day. */
export function decideNote(
  state: SessionState,
  entryId: string,
  destination: Destination | null,
  now: string,
): SessionState {
  const before = findEntry(state.entries, entryId)
  return {
    entries: patchEntry(state.entries, entryId, { mirroredTo: destination }, now),
    queue: without(state.queue, entryId),
    decisions: [
      ...state.decisions,
      decision(destination ? 'mirror' : 'keep-in-day', before, now),
    ],
  }
}

export function deleteEntry(state: SessionState, entryId: string, now: string): SessionState {
  const before = findEntry(state.entries, entryId)
  return {
    entries: state.entries.filter((e) => e.id !== entryId),
    queue: without(state.queue, entryId),
    decisions: [...state.decisions, decision('delete', before, now)],
  }
}

/** Sends the current entry to the end of the queue; it comes back after the rest. */
export function skip(state: SessionState): SessionState {
  if (state.queue.length < 2) return state
  const [first, ...rest] = state.queue
  return { ...state, queue: [...rest, first] }
}

/**
 * Reverts the most recent undoable decision. A deletion cannot be undone, so it is
 * passed over and the decision before it is reverted instead.
 */
export function undo(state: SessionState): SessionState {
  const target = lastUndoableIndex(state.decisions)
  if (target === -1) return state

  const d = state.decisions[target]
  return {
    entries: state.entries
      .filter((e) => e.id !== d.createdEntryId)
      .map((e) => (e.id === d.before.id ? d.before : e)),
    queue: [d.entryId, ...without(state.queue, d.entryId)],
    decisions: state.decisions.filter((_, i) => i !== target),
  }
}
