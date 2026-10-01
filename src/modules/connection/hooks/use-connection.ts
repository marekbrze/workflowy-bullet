import { useEffect } from 'react'
import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import { removeStored } from '@/shared/lib/storage'
import { MOCK_TREE } from '@/modules/note-filing/mock/tree'
import type { Destination } from '@/modules/note-filing/types/destination'
import { AUTH_FAILED } from '../lib/auth'
import {
  downloadTree,
  isAbort,
  normalizeApiKey,
  saveConnection,
  verifyApiKey,
} from '../lib/connection'
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
const ACCOUNT_DATA_KEYS = ['entries', 'review-sessions', 'saved-destinations']

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

  /**
   * Verifies the key, then downloads the tree, then saves. The key is saved last and everything is
   * rolled back if any write fails, so "connected" is only ever reported when it is true.
   * Used for both the first connect and "Change key".
   */
  const connect = async (
    rawKey: string,
    onPhase?: (phase: ConnectPhase) => void,
    { allowAccountChange = false, signal }: ConnectOptions = {},
  ): Promise<ConnectResult> => {
    const apiKey = normalizeApiKey(rawKey)
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
        record: { apiKey, status: 'connected', connectedAt: now, accountId },
      },
      { nodes, meta: snapshotMeta },
    )
    if (!saved) return { ok: false, message: SAVE_FAILED }
    // A different account: the old account's local copies must not mix with the new one's.
    if (record?.accountId && record.accountId !== accountId) {
      ACCOUNT_DATA_KEYS.forEach(removeStored)
    }
    return { ok: true }
  }

  return {
    status,
    apiKey: record?.apiKey ?? null,
    connectedAt: record?.connectedAt ?? null,
    accountId: record?.accountId ?? null,
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
      return keys.map(removeStored).every(Boolean)
    },
    /** Dev helper: pretend WorkFlowy stopped accepting the key. */
    markInvalid,
  }
}

export type Connection = ReturnType<typeof useConnection>
