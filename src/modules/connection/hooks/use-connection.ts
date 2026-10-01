import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import { MOCK_TREE } from '@/modules/note-filing/mock/tree'
import type { Destination } from '@/modules/note-filing/types/destination'
import { downloadTree, verifyApiKey } from '../lib/connection'
import type {
  ConnectionRecord,
  ConnectionStatus,
  ConnectPhase,
  ConnectResult,
} from '../types/connection'

export function useConnection() {
  // Stored as a one-element array so scenarios (which seed arrays) can provide it.
  const [records, setRecords] = useLocalStorage<ConnectionRecord[]>('connection', [])
  const [, setNodes, removeNodes] = useLocalStorage<Destination[]>('tree-nodes', [])
  const [, setSnapshotMeta, removeSnapshotMeta] = useLocalStorage<{ refreshedAt: string }[]>(
    'tree-snapshot',
    [],
  )

  const record = records[0] ?? null
  const status: ConnectionStatus = record ? record.status : 'disconnected'

  /** Verifies the key, then downloads the tree. Used for both first connect and "Change key". */
  const connect = async (
    apiKey: string,
    onPhase?: (phase: ConnectPhase) => void,
  ): Promise<ConnectResult> => {
    onPhase?.('verifying')
    const verified = await verifyApiKey(apiKey)
    if (!verified.ok) return verified

    onPhase?.('downloading')
    await downloadTree()
    setNodes(MOCK_TREE)
    setSnapshotMeta([{ refreshedAt: new Date().toISOString() }])
    setRecords([{ apiKey: apiKey.trim(), status: 'connected', connectedAt: new Date().toISOString() }])
    return { ok: true }
  }

  return {
    status,
    apiKey: record?.apiKey ?? null,
    connectedAt: record?.connectedAt ?? null,
    connect,
    /** Deletes the key and the tree snapshot. Sessions and saved destinations are kept. */
    disconnect: () => {
      setRecords([])
      removeNodes()
      removeSnapshotMeta()
    },
    /** Dev helper: pretend WorkFlowy stopped accepting the key. */
    markInvalid: () => {
      if (record) setRecords([{ ...record, status: 'invalid' }])
    },
  }
}

export type Connection = ReturnType<typeof useConnection>
