import { Button } from '@/components/ui/button'
import { formatAgo } from '@/shared/dates'
import { isSnapshotStale } from '../hooks/use-tree-snapshot'
import { useRefreshControl } from '../hooks/use-refresh-control'

/** A quiet one-line status of the tree snapshot, with a manual refresh. */
export function SnapshotStatus() {
  const { refreshedAt, refresh, rateLimited, message, refreshing } = useRefreshControl()
  const stale = isSnapshotStale(refreshedAt)

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span className="tabular-nums">
        {refreshing
          ? 'Refreshing your tree…'
          : !refreshedAt
          ? 'Tree not refreshed yet'
          : stale
            ? `Your tree may be out of date — refreshed ${formatAgo(refreshedAt)}`
            : `Tree refreshed ${formatAgo(refreshedAt)}`}
      </span>
      <Button variant="ghost" size="xs" onClick={refresh} disabled={rateLimited || refreshing}>
        Refresh
      </Button>
      {message && <span role="status">{message}</span>}
    </div>
  )
}
