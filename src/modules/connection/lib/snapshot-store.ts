import type { WorkflowyNode } from './workflowy-api'

/** The whole WorkFlowy tree as last downloaded. A real tree is megabytes, so it lives in IndexedDB. */
export interface StoredSnapshot {
  nodes: WorkflowyNode[]
  calendarId: string | null
  refreshedAt: string
}

const DB_NAME = 'wfb'
const STORE = 'snapshot'
const KEY = 'tree'

// Used when IndexedDB is unavailable (some private windows): the snapshot then lasts for the visit.
let memory: StoredSnapshot | null = null

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadSnapshot(): Promise<StoredSnapshot | null> {
  try {
    const db = await open()
    return await new Promise<StoredSnapshot | null>((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).get(KEY)
      request.onsuccess = () => resolve((request.result as StoredSnapshot | undefined) ?? null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return memory
  }
}

/** Returns `false` when the snapshot could not be persisted (it still stays in memory). */
export async function saveSnapshot(snapshot: StoredSnapshot): Promise<boolean> {
  memory = snapshot
  try {
    const db = await open()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite')
      transaction.objectStore(STORE).put(snapshot, KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    return true
  } catch {
    return false
  }
}

export async function clearSnapshot(): Promise<void> {
  memory = null
  try {
    const db = await open()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite')
      transaction.objectStore(STORE).delete(KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch {
    // Nothing persisted, nothing to clear.
  }
}
