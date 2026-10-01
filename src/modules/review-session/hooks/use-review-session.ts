import { useCallback, useMemo, useRef, useState } from 'react'
import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import { generateId } from '@/shared/types'
import { todayISO } from '@/shared/dates'
import type { Destination } from '@/modules/note-filing/types/destination'
import type { Entry, EntryType } from '../types/entry'
import type { ReviewMode, ReviewSession } from '../types/session'
import {
  buildQueue,
  canUndo,
  classify,
  decideNote,
  decideTask,
  deleteEntry,
  skip,
  undo,
  type SessionState,
  type TaskDecision,
} from '../lib/session-logic'

const SIMULATE_FAILURE_KEY = '__simulate_write_failure__'

// Dev-only: set this key to "1" in the console to make the next write fail once.
function maybeSimulateWriteFailure() {
  if (!import.meta.env.DEV) return
  if (window.localStorage.getItem(SIMULATE_FAILURE_KEY) !== '1') return
  window.localStorage.removeItem(SIMULATE_FAILURE_KEY)
  throw new Error('Simulated WorkFlowy write failure')
}

type Transition = (state: SessionState) => SessionState

export function useReviewSession(mode: ReviewMode) {
  const [entries, setEntries] = useLocalStorage<Entry[]>('entries', [])
  const [sessions, setSessions] = useLocalStorage<ReviewSession[]>('review-sessions', [])
  const [error, setError] = useState<string | null>(null)
  const failedTransition = useRef<Transition | null>(null)
  const today = useMemo(todayISO, [])

  // An ended session is removed, so any stored session is active.
  const session = sessions.find((s) => s.mode === mode) ?? null
  const candidateQueue = useMemo(() => buildQueue(entries, mode, today), [entries, mode, today])

  const start = useCallback(() => {
    if (candidateQueue.length === 0) return
    const now = new Date().toISOString()
    const created: ReviewSession = {
      id: generateId(),
      mode,
      queue: candidateQueue,
      total: candidateQueue.length,
      decisions: [],
      createdAt: now,
      updatedAt: now,
    }
    setSessions([...sessions.filter((s) => s.mode !== mode), created])
  }, [candidateQueue, mode, sessions, setSessions])

  const run = (transition: Transition) => {
    if (!session) return
    try {
      maybeSimulateWriteFailure()
      const next = transition({
        entries,
        queue: session.queue,
        decisions: session.decisions,
      })
      setEntries(next.entries)
      setSessions(
        sessions.map((s) =>
          s.id === session.id
            ? { ...s, queue: next.queue, decisions: next.decisions, updatedAt: new Date().toISOString() }
            : s,
        ),
      )
      failedTransition.current = null
      setError(null)
    } catch (e) {
      failedTransition.current = transition
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const now = () => new Date().toISOString()
  const currentId = session?.queue[0]
  const currentEntry = entries.find((e) => e.id === currentId) ?? null

  return {
    mode,
    today,
    session,
    currentEntry,
    candidateCount: candidateQueue.length,
    error,
    canUndo: session ? canUndo(session.decisions) : false,
    start,
    classify: (type: EntryType) => currentId && run((s) => classify(s, currentId, type, now())),
    decideTask: (kind: TaskDecision) =>
      currentId && run((s) => decideTask(s, currentId, kind, mode, today, now())),
    decideNote: (destination: Destination | null) =>
      currentId && run((s) => decideNote(s, currentId, destination, now())),
    deleteCurrent: () => currentId && run((s) => deleteEntry(s, currentId, now())),
    skip: () => run(skip),
    undo: () => run(undo),
    retry: () => {
      if (failedTransition.current) run(failedTransition.current)
    },
    dismissError: () => {
      failedTransition.current = null
      setError(null)
    },
    /** Ends the session; its decision history is discarded. */
    end: () => setSessions(sessions.filter((s) => s.mode !== mode)),
  }
}
