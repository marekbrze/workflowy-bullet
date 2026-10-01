import { Button } from '@/components/ui/button'

interface UnreadableDataNoticeProps {
  onStartFresh: () => void
}

/** Shown instead of "no entries" when the saved entries exist but cannot be read. */
export function UnreadableDataNotice({ onStartFresh }: UnreadableDataNoticeProps) {
  return (
    <section
      role="alert"
      aria-labelledby="unreadable-heading"
      className="rounded-xl border border-destructive/40 bg-destructive/10 p-6"
    >
      <h1 id="unreadable-heading" className="text-xl font-semibold">
        Your saved entries couldn&rsquo;t be read
      </h1>
      <p className="mt-2 text-sm text-foreground">
        The data stored in this browser looks damaged. A copy of it was kept, so nothing has been
        deleted. You can start with a clean slate now.
      </p>
      <Button className="mt-4" onClick={onStartFresh}>
        Start fresh
      </Button>
    </section>
  )
}
