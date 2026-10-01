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
