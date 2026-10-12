import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import { generateId } from '@/shared/types'
import { useToday } from '@/shared/hooks/use-today'
import { AuthError, reportAuthFailure } from '@/modules/connection/lib/auth'
import { ApiError } from '@/modules/connection/lib/workflowy-api'
import { CopyTooLargeError, getBackend, type Backend } from '@/modules/connection/lib/backend'
import type { Destination } from '@/modules/note-filing/types/destination'
import type { Entry, EntryType } from '../types/entry'
import type { ClassifyChoice, ReviewMode, ReviewSession } from '../types/session'
import {
  buildQueue,
  canGoBackToClassify,
  canUndo,
  classify,
  decideNote,
  decideTask,
  deleteEntry,
  describeNextUndo,
  lastUndoableDecision,
  newEntryIds,
  reconcileQueue,
  skip,
  undo,
  undoBlockedReason,
  type SessionState,
  type TaskDecision,
} from '../lib/session-logic'
import {
  remoteClassify,
  remoteDelete,
  remoteNote,
  remoteTask,
  remoteUndo,
  type RemoteResult,
} from '../lib/remote'

const SIMULATE_FAILURE_KEY = '__simulate_write_failure__'
const SAVE_FAILED = "Couldn't save to this browser."

// Dev-only: set this key to "1" in the console to make the next write fail once,
// or to "auth" to make WorkFlowy answer "unauthorized".
function maybeSimulateWriteFailure() {
  if (!import.meta.env.DEV) return
  const mode = window.localStorage.getItem(SIMULATE_FAILURE_KEY)
  if (mode !== '1' && mode !== 'auth') return
  window.localStorage.removeItem(SIMULATE_FAILURE_KEY)
  if (mode === 'auth') throw new AuthError()
  throw new Error('Simulated WorkFlowy write failure')
}

/** What to do in WorkFlowy, and how the session state changes once that has happened. */
interface Action {
  remote: ((backend: Backend) => Promise<RemoteResult | void>) | null
  apply: (state: SessionState, result: RemoteResult) => SessionState
}

export function useReviewSession(mode: ReviewMode) {
  // This hook shows its own error state, so the app-wide storage banner is switched off.
  const [entries, setEntries] = useLocalStorage<Entry[]>('entries', [], { reportFailure: false })
  const [sessions, setSessions] = useLocalStorage<ReviewSession[]>('review-sessions', [], {
    reportFailure: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const retryAction = useRef<(() => void) | null>(null)
  const today = useToday()

  // The freshest stored state. A decision awaits WorkFlowy; the tree can be refreshed meanwhile,
  // and the decision must be applied to what is stored *then*, not to what it saw when it began.
  const latest = useRef({ entries, sessions })
  useEffect(() => {
    latest.current = { entries, sessions }
  })

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

  const act = async (action: Action): Promise<boolean> => {
    if (!session || pendingRef.current) return false
    pendingRef.current = true
    setPending(true)
    // Kept across retries: if WorkFlowy accepted the change but saving here failed, a retry must
    // not do it twice (a second roll-over would make a second copy).
    let remoteResult: RemoteResult | undefined

    const attempt = async (): Promise<boolean> => {
      try {
        maybeSimulateWriteFailure()
        if (remoteResult === undefined) {
          remoteResult = (action.remote ? await action.remote(getBackend()) : undefined) ?? {}
        }
        const fresh = latest.current
        const freshSession = fresh.sessions.find((s) => s.id === session.id)
        if (!freshSession) return false
        const next = action.apply(
          {
            entries: fresh.entries,
            queue: reconcileQueue(fresh.entries, freshSession.queue),
            decisions: freshSession.decisions,
          },
          remoteResult,
        )
        // A decision touches two keys. If the second write fails, put the first one back.
        if (!setEntries(next.entries)) throw new Error(SAVE_FAILED)
        const saved = setSessions(
          fresh.sessions.map((s) =>
            s.id === session.id
              ? { ...s, queue: next.queue, decisions: next.decisions, updatedAt: new Date().toISOString() }
              : s,
          ),
        )
        if (!saved) {
          setEntries(fresh.entries)
          throw new Error(SAVE_FAILED)
        }
        retryAction.current = null
        setError(null)
        setErrorDetail(null)
        setNotice(null)
        return true
      } catch (e) {
        if (e instanceof AuthError) {
          // The key stopped working: hand over to the invalid-key flow. The session stays stored.
          retryAction.current = null
          setError(null)
          reportAuthFailure()
          return false
        }
        retryAction.current = () => {
          if (pendingRef.current) return
          pendingRef.current = true
          setPending(true)
          void attempt().then(finish)
        }
        setError(e instanceof Error ? e.message : 'Unknown error')
        // Most failures read the same ("it didn't reach WorkFlowy"); a few have their own advice.
        // A reply from WorkFlowy (e.g. "404: not found") says more than "check your connection".
        setErrorDetail(e instanceof CopyTooLargeError || e instanceof ApiError ? e.message : null)
        return false
      }
    }
    const finish = (ok: boolean) => {
      pendingRef.current = false
      setPending(false)
      return ok
    }
    return attempt().then(finish)
  }

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
    /** Extra advice for the error, when the generic message does not fit */
    errorDetail,
    notice,
    /** A decision is being sent to WorkFlowy */
    pending,
    canDismissError: session !== null,
    canUndo: session ? canUndo(session.decisions) : false,
    /** The note picker can step back to the classification of the current entry */
    canGoBack: session && currentId ? canGoBackToClassify(session.decisions, currentId) : false,
    undoLabel: session ? describeNextUndo(session.decisions) : null,
    start,
    addNewEntries,
    /** `wrapperName` names a code block, which is never tagged itself. */
    classify: (choice: ClassifyChoice, wrapperName?: string) => {
      const entry = currentEntry
      if (!entry) return Promise.resolve(false)
      const type: EntryType = choice === 'note-in-day' ? 'note' : choice
      return act({
        remote: (backend) => remoteClassify(backend, entry, type, wrapperName),
        apply: (s, result) =>
          classify(s, entry.id, type, now(), {
            wrapperName,
            codeChildId: result.codeChildId,
            keepInDay: choice === 'note-in-day',
          }),
      })
    },
    decideTask: (kind: TaskDecision) => {
      const entry = currentEntry
      if (!entry) return Promise.resolve(false)
      return act({
        remote: (backend) => remoteTask(backend, entry, kind, mode, today),
        apply: (s, result) => decideTask(s, entry.id, kind, mode, today, now(), result.copyId),
      })
    },
    decideNote: (destination: Destination | null) => {
      const entry = currentEntry
      if (!entry) return Promise.resolve(false)
      return act({
        remote: (backend) => remoteNote(backend, entry, destination),
        apply: (s, result) =>
          decideNote(
            s,
            entry.id,
            result.createdDestination ?? destination,
            now(),
            result.mirrorItemId,
            result.createdDestination?.id,
          ),
      })
    },
    deleteCurrent: () => {
      const entry = currentEntry
      if (!entry) return Promise.resolve(false)
      return act({
        remote: (backend) => remoteDelete(backend, entry),
        apply: (s) => deleteEntry(s, entry.id, now()),
      })
    },
    skip: () => act({ remote: null, apply: (s) => skip(s) }),
    undo: () => {
      if (!session) return Promise.resolve(false)
      const reason = undoBlockedReason({ entries, queue, decisions: session.decisions })
      if (reason) {
        setNotice(reason)
        return Promise.resolve(false)
      }
      const decision = lastUndoableDecision(session.decisions)
      if (!decision) return Promise.resolve(false)
      return act({
        remote: (backend) => remoteUndo(backend, decision),
        apply: (s) => undo(s),
      })
    },
    retry: () => retryAction.current?.(),
    dismissError: () => {
      retryAction.current = null
      pendingRef.current = false
      setError(null)
      setErrorDetail(null)
    },
    /** Ends the session; its decision history is discarded. */
    end: () => setSessions(sessions.filter((s) => s.mode !== mode)),
  }
}
