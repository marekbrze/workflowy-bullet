import { readStorage, writeStorage } from '@/shared/lib/storage'
import type { MirrorRecord } from './tree'

const KEY = 'mirrors'

/**
 * Mirrors the app created, by the id of the bullet that was mirrored. WorkFlowy's API does not
 * say which bullets are mirrored, so the app remembers its own — it needs the mirror's id to
 * move or undo it.
 */
export function loadMirrors(): Record<string, MirrorRecord> {
  return readStorage<Record<string, MirrorRecord>>(KEY, {}).value
}

export function saveMirror(originId: string, record: MirrorRecord | null): boolean {
  const all = { ...loadMirrors() }
  if (record) all[originId] = record
  else delete all[originId]
  return writeStorage(KEY, all)
}
