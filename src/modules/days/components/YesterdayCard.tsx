import { Button } from '@/components/ui/button'
import { formatFullDate } from '@/shared/dates'
import { dayStatusText, type DaySummary } from '../lib/days'

interface YesterdayCardProps {
  day: DaySummary
  /** Entries left in an active `yesterday` session, if there is one */
  remaining: number | null
  onStart: () => void
}

export function YesterdayCard({ day, remaining, onStart }: YesterdayCardProps) {
  const resuming = remaining !== null
  const canStart = resuming || day.waiting > 0

  return (
    <section aria-labelledby="yesterday-heading" className="rounded-xl border bg-card p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="yesterday-heading" className="text-lg font-semibold">
          Yesterday
        </h2>
        <span className="text-xs text-muted-foreground">{formatFullDate(day.date)}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {resuming ? `${remaining} left in your review` : dayStatusText(day)}
      </p>
      {canStart && (
        <Button className="mt-4" size="lg" onClick={onStart}>
          {resuming ? 'Continue' : 'Start'}
        </Button>
      )}
    </section>
  )
}
