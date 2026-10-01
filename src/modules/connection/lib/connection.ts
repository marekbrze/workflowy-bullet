import type { Destination } from '@/modules/note-filing/types/destination'
import type { ConnectionRecord, VerifyResult } from '../types/connection'

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Strips what a copy-paste often drags along: whitespace, surrounding quotes, a "Bearer " prefix. */
export function normalizeApiKey(key: string): string {
  let result = key.trim()
  result = result.replace(/^bearer\s+/i, '')
  result = result.replace(/^["'`](.*)["'`]$/, '$1')
  return result.trim()
}

/** Mock account identity: keys look like `wf-<account>-<secret>`; anything else is one "default" account. */
export function accountIdFromKey(key: string): string {
  const parts = key.split('-')
  return parts.length >= 3 ? parts[1] : 'default'
}

/**
 * Mocked WorkFlowy key check. Rules a tester can rely on:
 * - an empty key, a key shorter than 8 characters, or one containing "invalid" is rejected;
 * - a key containing "offline" simulates a network failure;
 * - anything else is accepted, and belongs to the account named in the key (`wf-<account>-<secret>`).
 */
export async function verifyApiKey(
  key: string,
  ms = 600,
  signal?: AbortSignal,
): Promise<VerifyResult> {
  await delay(ms, signal)
  const normalized = normalizeApiKey(key)
  if (!normalized) return { ok: false, message: 'Enter your API key to continue.' }
  if (normalized.includes('offline')) {
    return { ok: false, message: "Couldn't reach WorkFlowy. Check your connection and try again." }
  }
  if (normalized.length < 8 || normalized.includes('invalid')) {
    return {
      ok: false,
      message: 'WorkFlowy did not accept this key. Check that you copied all of it.',
    }
  }
  return { ok: true, accountId: accountIdFromKey(normalized) }
}

/** Mocked `/nodes-export` download. */
export async function downloadTree(ms = 900, signal?: AbortSignal): Promise<void> {
  await delay(ms, signal)
}

export function maskKey(key: string): string {
  if (key.length <= 8) return '••••'
  return `${key.slice(0, 3)}••••${key.slice(-4)}`
}

export interface SnapshotMeta {
  refreshedAt: string
}

/** The three writes behind a connection; each returns `false` when storage refused. */
export interface ConnectionWrites {
  setNodes: (nodes: Destination[]) => boolean
  setSnapshotMeta: (meta: SnapshotMeta[]) => boolean
  setRecords: (records: ConnectionRecord[]) => boolean
}

/**
 * Saves a connection all-or-nothing. The key goes last, so "connected" is only ever true when the
 * tree and snapshot before it were saved; if any write fails, the earlier ones are put back.
 */
export function saveConnection(
  writes: ConnectionWrites,
  next: { nodes: Destination[]; meta: SnapshotMeta[]; record: ConnectionRecord },
  previous: { nodes: Destination[]; meta: SnapshotMeta[] },
): boolean {
  if (!writes.setNodes(next.nodes)) return false
  if (!writes.setSnapshotMeta(next.meta)) {
    writes.setNodes(previous.nodes)
    return false
  }
  if (!writes.setRecords([next.record])) {
    writes.setNodes(previous.nodes)
    writes.setSnapshotMeta(previous.meta)
    return false
  }
  return true
}
