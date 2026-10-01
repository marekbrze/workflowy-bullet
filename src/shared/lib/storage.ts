export const STORAGE_WRITE_FAILED = 'storage-write-failed'

/** Writes JSON to LocalStorage. Returns `false` instead of throwing (quota, blocked storage). */
export function writeStorage(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
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
    raw = window.localStorage.getItem(key)
    return { value: raw ? (JSON.parse(raw) as T) : fallback, unreadable: false }
  } catch {
    if (raw !== null) {
      try {
        window.localStorage.setItem(`${key}.backup`, raw)
      } catch {
        // Nothing more can be done; the notice still tells the user.
      }
    }
    return { value: fallback, unreadable: true }
  }
}
