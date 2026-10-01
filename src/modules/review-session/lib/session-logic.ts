import { addDays } from '@/shared/dates'
import { generateId } from '@/shared/types'
import type { Destination } from '@/modules/note-filing/types/destination'
import type { Entry, EntryType } from '../types/entry'
import type { Decision, DecisionKind, ReviewMode } from '../types/session'

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

export function getStep(entry: Entry): Step {
  if (entry.type === null) return 'classify'
  if (entry.type === 'note') return 'note'
  return 'task'
}

export function rollOverTarget(mode: ReviewMode, today: string): string {
  return mode === 'today' ? addDays(today, 1) : today
}

export function canUndo(decisions: Decision[]): boolean {
  return decisions.some((d) => d.kind !== 'delete')
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

export function classify(
  state: SessionState,
  entryId: string,
  type: EntryType,
  now: string,
): SessionState {
  const before = findEntry(state.entries, entryId)
  const patch: Partial<Entry> = { type, outcome: type === 'task' ? 'open' : null }
  return {
    entries: patchEntry(state.entries, entryId, patch, now),
    // A task still needs its fate and a note still needs a destination; an event is done.
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

  if (kind === 'done') entries = patchEntry(entries, entryId, { outcome: 'done' }, now)
  if (kind === 'irrelevant') entries = patchEntry(entries, entryId, { outcome: 'irrelevant' }, now)
  if (kind === 'roll-over') {
    // The original stays in its day as history; an independent copy goes to the target day.
    const copy: Entry = {
      ...before,
      id: generateId(),
      date: rollOverTarget(mode, today),
      type: 'task',
      outcome: 'open',
      mirroredTo: null,
      createdAt: now,
      updatedAt: now,
    }
    createdEntryId = copy.id
    entries = [...patchEntry(entries, entryId, { outcome: 'migrated' }, now), copy]
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
  const target = findLastUndoable(state.decisions)
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

function findLastUndoable(decisions: Decision[]): number {
  for (let i = decisions.length - 1; i >= 0; i--) {
    if (decisions[i].kind !== 'delete') return i
  }
  return -1
}
