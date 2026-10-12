import { useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { stripHtml } from '@/modules/review-session/lib/tags'
import { findArchived, purgeArchive } from '../lib/archive'
import { getSnapshotState, subscribeSnapshot } from '../lib/snapshot-state'

/** Deletes every `#archive` bullet from WorkFlowy in one go. */
export function ArchivePurge() {
  const { index } = useSyncExternalStore(subscribeSnapshot, getSnapshotState)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; name: string } | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  // The tree is changed in place, so the count is read again after each purge.
  const [, setVersion] = useState(0)

  if (!index) return null
  const count = findArchived(index).length

  const run = async () => {
    setBusy(true)
    const { deleted, failed, firstError } = await purgeArchive(index, undefined, (done, total, current) =>
      setProgress({ done, total, name: stripHtml(current.name) }),
    )
    setBusy(false)
    setProgress(null)
    setConfirming(false)
    setVersion((value) => value + 1)
    setMessage(
      failed > 0
        ? `Deleted ${deleted}, but ${failed} could not be deleted${firstError ? ` (${firstError})` : ''}. Try again.`
        : `Deleted ${deleted} archived ${deleted === 1 ? 'item' : 'items'}.`,
    )
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Archive</h2>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          {count === 0 ? 'Nothing tagged #archive.' : `${count} ${count === 1 ? 'item' : 'items'} tagged #archive.`}
        </span>
        <Button variant="outline" size="sm" disabled={count === 0 || busy} onClick={() => setConfirming(true)}>
          Delete all archived
        </Button>
        {message && <span role="status">{message}</span>}
      </div>
      <ConfirmDialog
        open={confirming}
        title="Delete all archived items?"
        description={`${count} ${count === 1 ? 'item' : 'items'} tagged #archive will be permanently deleted from WorkFlowy, together with everything under them. This can't be undone.`}
        confirmLabel={busy ? 'Deleting…' : 'Delete all'}
        destructive
        onConfirm={run}
        onCancel={() => (busy ? undefined : setConfirming(false))}
      >
        {progress && (
          <div role="status" className="mt-3 text-sm">
            <p className="tabular-nums">
              Deleting {progress.done + 1} of {progress.total}
            </p>
            <progress className="mt-1 w-full" value={progress.done} max={progress.total} />
            <p className="mt-1 truncate text-muted-foreground">{progress.name}</p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
