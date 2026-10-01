/** Placeholder with the card's shape, shown for the moment before a session is ready. */
export function EntryCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading your entries"
      className="animate-pulse rounded-xl border bg-card p-6"
    >
      <div className="flex justify-between">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-3 w-12 rounded bg-muted" />
      </div>
      <div className="mt-5 h-6 w-4/5 rounded bg-muted" />
      <div className="mt-2 h-6 w-2/3 rounded bg-muted" />
      <div className="mt-5 h-5 w-20 rounded-full bg-muted" />
    </div>
  )
}
