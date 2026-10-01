import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import { generateId } from '@/shared/types'
import { useToday } from '@/shared/hooks/use-today'
import type { Destination } from '@/modules/note-filing/types/destination'
import type { Entry, EntryType } from '../types/entry'
import type { ReviewMode, ReviewSession } from '../types/session'
import {
  buildQueue,
  canGoBackToClassify,
  canUndo,
  classify,
  decideNote,
  decideTask,
  deleteEntry,
  describeNextUndo,
  newEntryIds,
  reconcileQueue,
  skip,
  undo,
  undoBlockedReason,
  type SessionState,
  type TaskDecision,
} from '../lib/session-logic'

const SIMULATE_FAILURE_KEY = '__simulate_write_failure__'
const SAVE_FAILED = "Couldn't save to this browser."

// Dev-only: set this key to "1" in the console to make the next write fail once.
function maybeSimulateWriteFailure() {
  if (!import.meta.env.DEV) return
  if (window.localStorage.getItem(SIMULATE_FAILURE_KEY) !== '1') return
  window.localStorage.removeItem(SIMULATE_FAILURE_KEY)
  throw new Error('Simulated WorkFlowy write failure')
}

type Transition = (state: SessionState) => SessionState

export function useReviewSession(mode: ReviewMode) {
  // This hook shows its own error state, so the app-wide storage banner is switched off.
  const [entries, setEntries] = useLocalStorage<Entry[]>('entries', [], { reportFailure: false })
  const [sessions, setSessions] = useLocalStorage<ReviewSession[]>('review-sessions', [], {
    reportFailure: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const retryAction = useRef<(() => void) | null>(null)
  const today = useToday()

  // An ended session is removed, so any stored session is active.
  const session = sessions.find((s) => s.mode === mode) ?? null
  const candidateQueue = useMemo(() => buildQueue(entries, mode, today), [entries, mode, today])
  // The stored queue can be stale (entries deleted or typed elsewhere): always work on the real one.
  const queue = useMemo(
    () => (session ? reconcileQueue(entries, session.queue) : []),
    [entries, session],
  )

  const start = () => {
    if (candidateQueue.length === 0) return
    const now = new Date().toISOString()
    const created: ReviewSession = {
      id: generateId(),
      mode,
      queue: candidateQueue,
      total: candidateQueue.length,
      knownIds: candidateQueue,
      decisions: [],
      createdAt: now,
      updatedAt: now,
    }
    if (setSessions([...sessions.filter((s) => s.mode !== mode), created])) {
      retryAction.current = null
      setError(null)
    } else {
      retryAction.current = start
      setError(SAVE_FAILED)
    }
  }

  const run = (transition: Transition): boolean => {
    if (!session) return false
    const previousEntries = entries
    try {
      maybeSimulateWriteFailure()
      const next = transition({ entries, queue, decisions: session.decisions })
      // A decision touches two keys. If the second write fails, put the first one back.
      if (!setEntries(next.entries)) throw new Error(SAVE_FAILED)
      const saved = setSessions(
        sessions.map((s) =>
          s.id === session.id
            ? { ...s, queue: next.queue, decisions: next.decisions, updatedAt: new Date().toISOString() }
            : s,
        ),
      )
      if (!saved) {
        setEntries(previousEntries)
        throw new Error(SAVE_FAILED)
      }
      retryAction.current = null
      setError(null)
      setNotice(null)
      return true
    } catch (e) {
      retryAction.current = () => runRef.current(transition)
      setError(e instanceof Error ? e.message : 'Unknown error')
      return false
    }
  }

  // Retrying must use the latest render's state, not the one captured when it failed.
  const runRef = useRef(run)
  useEffect(() => {
    runRef.current = run
  })

  /** On resume: queue entries that entered the session's scope since it started. */
  const addNewEntries = () => {
    if (!session) return
    const added = newEntryIds(session, entries, today)
    if (added.length === 0) return
    const saved = setSessions(
      sessions.map((s) =>
        s.id === session.id
          ? {
              ...s,
              queue: [...s.queue, ...added],
              total: s.total + added.length,
              knownIds: [...(s.knownIds ?? s.queue), ...added],
              updatedAt: new Date().toISOString(),
            }
          : s,
      ),
    )
    if (saved) setNotice(`${added.length} new ${added.length === 1 ? 'entry' : 'entries'} added`)
  }

  const now = () => new Date().toISOString()
  const currentId = queue[0]
  const currentEntry = entries.find((e) => e.id === currentId) ?? null

  return {
    mode,
    today,
    session,
    queue,
    currentEntry,
    candidateCount: candidateQueue.length,
    error,
    notice,
    canDismissError: session !== null,
    canUndo: session ? canUndo(session.decisions) : false,
    /** The note picker can step back to the classification of the current entry */
    canGoBack: session && currentId ? canGoBackToClassify(session.decisions, currentId) : false,
    undoLabel: session ? describeNextUndo(session.decisions) : null,
    start,
    addNewEntries,
    classify: (type: EntryType) => (currentId ? run((s) => classify(s, currentId, type, now())) : false),
    decideTask: (kind: TaskDecision) =>
      currentId ? run((s) => decideTask(s, currentId, kind, mode, today, now())) : false,
    decideNote: (destination: Destination | null) =>
      currentId ? run((s) => decideNote(s, currentId, destination, now())) : false,
    deleteCurrent: () => (currentId ? run((s) => deleteEntry(s, currentId, now())) : false),
    skip: () => run(skip),
    undo: () => {
      if (!session) return false
      const reason = undoBlockedReason({ entries, queue, decisions: session.decisions })
      if (reason) {
        setNotice(reason)
        return false
      }
      return run(undo)
    },
    retry: () => retryAction.current?.(),
    dismissError: () => {
      retryAction.current = null
      setError(null)
    },
    /** Ends the session; its decision history is discarded. */
    end: () => setSessions(sessions.filter((s) => s.mode !== mode)),
  }
}
