import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/shared/components/Kbd'

interface SessionSummaryProps {
  processed: number
  canUndo: boolean
  onUndo: () => void
  onDone: () => void
}

// Deliberately plain: no praise, no effects.
export function SessionSummary({ processed, canUndo, onUndo, onDone }: SessionSummaryProps) {
  const doneRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    doneRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="summary-heading" className="rounded-xl border bg-card p-6">
      <h1 id="summary-heading" className="text-xl font-semibold">
        Queue finished
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {processed} {processed === 1 ? 'entry' : 'entries'} processed.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <Button ref={doneRef} onClick={onDone}>
          Done
        </Button>
        <Button variant="ghost" onClick={onUndo} disabled={!canUndo}>
          Undo <Kbd>k</Kbd>
        </Button>
      </div>
    </section>
  )
}
