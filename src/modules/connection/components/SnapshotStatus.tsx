import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatAgo } from '@/shared/dates'
import { useTreeSnapshot } from '../hooks/use-tree-snapshot'

/** A quiet one-line status of the tree snapshot, with a manual refresh. */
export function SnapshotStatus() {
  const { refreshedAt, refresh } = useTreeSnapshot()
  const [note, setNote] = useState<string | null>(null)

  const onRefresh = () => {
    const result = refresh()
    setNote(
      result.ok
        ? null
        : `WorkFlowy allows one refresh per minute. Try again in ${result.retryInSeconds} s.`,
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>{refreshedAt ? `Tree refreshed ${formatAgo(refreshedAt)}` : 'Tree not refreshed yet'}</span>
      <Button variant="ghost" size="xs" onClick={onRefresh}>
        Refresh
      </Button>
      {note && <span role="status">{note}</span>}
    </div>
  )
}
