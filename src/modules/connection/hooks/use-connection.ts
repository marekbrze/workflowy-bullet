import { useEffect } from 'react'
import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import { todayISO } from '@/shared/dates'
import { readStorage, removeStored, writeStorage } from '@/shared/lib/storage'
import { MOCK_TREE } from '@/modules/note-filing/mock/tree'
import type { Destination } from '@/modules/note-filing/types/destination'
import type { Entry } from '@/modules/review-session/types/entry'
import { AUTH_FAILED, AuthError } from '../lib/auth'
import {
  downloadTree,
  isAbort,
  normalizeApiKey,
  saveConnection,
  verifyApiKey,
} from '../lib/connection'
import { loadMirrors } from '../lib/mirrors'
import { downloadSnapshot } from '../lib/refresh'
import { clearSnapshotState, setSnapshot } from '../lib/snapshot-state'
import { clearSnapshot, saveSnapshot } from '../lib/snapshot-store'
import { deriveEntries } from '../lib/tree'
import {
  ApiError,
  createApi,
  DEFAULT_API_BASE,
  NetworkError,
  RateLimitError,
} from '../lib/workflowy-api'
import type {
  ConnectionRecord,
  ConnectionStatus,
  ConnectOptions,
  ConnectPhase,
  ConnectResult,
} from '../types/connection'

const SAVE_FAILED =
  "Couldn't save your connection in this browser. Storage may be full or blocked."
const OFF = { reportFailure: false }

/** Local copies of WorkFlowy content that belong to one account. */
const ACCOUNT_DATA_KEYS = ['entries', 'review-sessions', 'saved-destinations', 'mirrors']

/** `VITE_MOCK_API=1` runs the connect flow against local sample data (no network), for UI work. */
const MOCK_API = import.meta.env?.VITE_MOCK_API === '1'

const KEY_REJECTED = 'WorkFlowy did not accept this key. Check that you copied all of it.'
const UNREACHABLE = "Couldn't reach WorkFlowy. Check your connection and try again."

export function useConnection() {
  // This hook reports failures itself, so the app-wide storage banner is switched off.
  // Stored as a one-element array so scenarios (which seed arrays) can provide it.
  const [records, setRecords, , recordStatus] = useLocalStorage<ConnectionRecord[]>('connection', [], OFF)
  const [nodes, setNodes] = useLocalStorage<Destination[]>('tree-nodes', [], OFF)
  const [snapshotMeta, setSnapshotMeta] = useLocalStorage<{ refreshedAt: string }[]>(
    'tree-snapshot',
    [],
    OFF,
  )

  const record = records[0] ?? null
  const status: ConnectionStatus = record ? record.status : 'disconnected'

  const markInvalid = () => {
    if (record && record.status !== 'invalid') setRecords([{ ...record, status: 'invalid' }])
  }

  // Any module that gets "unauthorized" from WorkFlowy reports it; the connection follows.
  useEffect(() => {
    window.addEventListener(AUTH_FAILED, markInvalid)
    return () => window.removeEventListener(AUTH_FAILED, markInvalid)
  })

  /** Connects to the real WorkFlowy: checks the key, downloads the tree, derives the entries, saves. */
  const connectLive = async (
    apiKey: string,
    onPhase: ((phase: ConnectPhase) => void) | undefined,
    { allowAccountChange = false, signal }: ConnectOptions,
  ): Promise<ConnectResult> => {
    const api = createApi({ baseUrl: DEFAULT_API_BASE, apiKey })
    let snapshot
    let accountId: string
    try {
      onPhase?.('verifying')
      await api.listTargets(signal)
      // The calendar is unique to the account, so its id tells accounts apart.
      accountId = (await api.getNode('calendar', signal)).id

      const accountChanged = Boolean(record?.accountId && record.accountId !== accountId)
      if (accountChanged && !allowAccountChange) {
        return {
          ok: false,
          accountChange: true,
          message: 'This key belongs to a different WorkFlowy account.',
        }
      }

      onPhase?.('downloading')
      snapshot = await downloadSnapshot(api, signal)
    } catch (error) {
      if (isAbort(error)) return { ok: false, cancelled: true, message: 'Cancelled.' }
      if (error instanceof AuthError) return { ok: false, message: KEY_REJECTED }
      if (error instanceof NetworkError) return { ok: false, message: UNREACHABLE }
      if (error instanceof RateLimitError) {
        return { ok: false, message: 'WorkFlowy allows one download per minute. Try again shortly.' }
      }
      if (error instanceof ApiError) return { ok: false, message: error.message }
      throw error
    }

    const accountChanged = Boolean(record?.accountId && record.accountId !== accountId)
    const previousEntries = readStorage<Entry[]>('entries', []).value
    // The old account's mirrors must not leak into the new account's entries.
    const index = setSnapshot(snapshot)
    await saveSnapshot(snapshot)
    const entries = deriveEntries(index, todayISO(), accountChanged ? {} : loadMirrors())

    // The key goes last: "connected" is only ever reported when everything before it was saved.
    if (!writeStorage('entries', entries)) return { ok: false, message: SAVE_FAILED }
    const now = new Date().toISOString()
    if (!setRecords([{ apiKey, status: 'connected', connectedAt: now, mode: 'live', accountId }])) {
      writeStorage('entries', previousEntries)
      return { ok: false, message: SAVE_FAILED }
    }
    if (accountChanged) {
      // Entries were just replaced in place; the rest of the old account's data goes now.
      ACCOUNT_DATA_KEYS.filter((key) => key !== 'entries').forEach(removeStored)
    }
    return { ok: true }
  }

  /** Development only: the original flow against local sample data. */
  const connectMock = async (
    apiKey: string,
    onPhase: ((phase: ConnectPhase) => void) | undefined,
    { allowAccountChange = false, signal }: ConnectOptions,
  ): Promise<ConnectResult> => {
    let accountId = 'default'
    try {
      onPhase?.('verifying')
      const verified = await verifyApiKey(apiKey, undefined, signal)
      if (!verified.ok) return verified
      accountId = verified.accountId

      const accountChanged = Boolean(record?.accountId && record.accountId !== accountId)
      if (accountChanged && !allowAccountChange) {
        return {
          ok: false,
          accountChange: true,
          message: 'This key belongs to a different WorkFlowy account.',
        }
      }

      onPhase?.('downloading')
      await downloadTree(undefined, signal)
    } catch (error) {
      if (isAbort(error)) return { ok: false, cancelled: true, message: 'Cancelled.' }
      throw error
    }

    const now = new Date().toISOString()
    const saved = saveConnection(
      { setNodes, setSnapshotMeta, setRecords },
      {
        nodes: MOCK_TREE,
        meta: [{ refreshedAt: now }],
        record: { apiKey, status: 'connected', connectedAt: now, mode: 'demo', accountId },
      },
      { nodes, meta: snapshotMeta },
    )
    if (!saved) return { ok: false, message: SAVE_FAILED }
    if (record?.accountId && record.accountId !== accountId) {
      ACCOUNT_DATA_KEYS.forEach(removeStored)
    }
    return { ok: true }
  }

  /**
   * Verifies the key, downloads the tree, then saves. The key is saved last and everything is
   * rolled back if any write fails, so "connected" is only ever reported when it is true.
   * Used for both the first connect and "Change key".
   */
  const connect = async (
    rawKey: string,
    onPhase?: (phase: ConnectPhase) => void,
    options: ConnectOptions = {},
  ): Promise<ConnectResult> => {
    const apiKey = normalizeApiKey(rawKey)
    if (!apiKey) return { ok: false, message: 'Enter your API key to continue.' }
    return MOCK_API ? connectMock(apiKey, onPhase, options) : connectLive(apiKey, onPhase, options)
  }

  return {
    status,
    apiKey: record?.apiKey ?? null,
    connectedAt: record?.connectedAt ?? null,
    accountId: record?.accountId ?? null,
    mode: record?.mode ?? 'demo',
    /** The saved connection exists but could not be read */
    unreadable: recordStatus.unreadable,
    connect,
    /** `connect` in the shape the connect form expects (with an abort signal) */
    submit: (apiKey: string, onPhase: (phase: ConnectPhase) => void, signal?: AbortSignal) =>
      connect(apiKey, onPhase, { signal }),
    /**
     * Deletes the key and the tree snapshot. Entries, sessions and saved destinations are kept for
     * a later reconnect, unless `removeLocalData` is set. Returns `false` if storage refused.
     */
    disconnect: ({ removeLocalData = false }: { removeLocalData?: boolean } = {}): boolean => {
      const keys = ['connection', 'tree-nodes', 'tree-snapshot', ...(removeLocalData ? ACCOUNT_DATA_KEYS : [])]
      const ok = keys.map(removeStored).every(Boolean)
      void clearSnapshot()
      clearSnapshotState()
      return ok
    },
    /** Dev helper: pretend WorkFlowy stopped accepting the key. */
    markInvalid,
  }
}

export type Connection = ReturnType<typeof useConnection>

