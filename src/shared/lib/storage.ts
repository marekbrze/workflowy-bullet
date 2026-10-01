export const STORAGE_WRITE_FAILED = 'storage-write-failed'
/** Fired in the same tab after a successful write, so every hook reading that key can refresh. */
export const STORAGE_CHANGED = 'app-storage-changed'

/**
 * Every key is namespaced. On GitHub Pages all projects of an account share one origin, so
 * plain names like "entries" or "connection" could collide with another site's data (and
 * the stored API key would sit next to it).
 */
const PREFIX = 'wfb:'

export function storageKey(key: string): string {
  return `${PREFIX}${key}`
}

/** Logical keys the app used before they were namespaced. */
const LEGACY_KEYS = [
  'entries',
  'review-sessions',
  'connection',
  'tree-nodes',
  'tree-snapshot',
  'saved-destinations',
]

/** One-time move of data stored under the old plain keys to the namespaced ones. */
export function migrateLegacyStorage(): void {
  try {
    for (const key of LEGACY_KEYS) {
      const raw = window.localStorage.getItem(key)
      if (raw === null) continue
      if (window.localStorage.getItem(storageKey(key)) === null) {
        window.localStorage.setItem(storageKey(key), raw)
      }
      window.localStorage.removeItem(key)
    }
  } catch {
    // Storage is unavailable; the app reports that where it matters.
  }
}

/** Lets other hooks in this tab reload `key`. A failure to notify must never turn a saved write into a failed one. */
function notifyChanged(key: string): void {
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGED, { detail: { key } }))
  } catch {
    // Nobody is listening; the data is saved either way.
  }
}

/** Writes JSON to LocalStorage. Returns `false` instead of throwing (quota, blocked storage). */
export function writeStorage(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value))
  } catch {
    return false
  }
  notifyChanged(key)
  return true
}

/** Removes a key. Returns `false` if storage refused. */
export function removeStored(key: string): boolean {
  try {
    window.localStorage.removeItem(storageKey(key))
  } catch {
    return false
  }
  notifyChanged(key)
  return true
}

/** Removes every key of this app (and only those), except the ones named in `keep`. */
export function clearAppStorage(keep: string[] = []): void {
  const kept = new Set(keep.map(storageKey))
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(PREFIX) && !kept.has(key)) window.localStorage.removeItem(key)
    }
  } catch {
    // Ignored.
  }
}

/** Tells the app-wide banner that a save did not reach the browser. */
export function reportStorageFailure(key: string): void {
  window.dispatchEvent(new CustomEvent(STORAGE_WRITE_FAILED, { detail: { key } }))
}

export type StorageRead<T> = { value: T; unreadable: boolean }

/**
 * Reads JSON from LocalStorage. If the stored text cannot be parsed, the fallback is returned,
 * `unreadable` is set, and the raw text is copied to `<key>.backup` so a later write cannot destroy it.
 */
export function readStorage<T>(key: string, fallback: T): StorageRead<T> {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(storageKey(key))
    return { value: raw ? (JSON.parse(raw) as T) : fallback, unreadable: false }
  } catch {
    if (raw !== null) {
      try {
        window.localStorage.setItem(`${storageKey(key)}.backup`, raw)
      } catch {
        // Nothing more can be done; the notice still tells the user.
      }
    }
    return { value: fallback, unreadable: true }
  }
}
