import { formatDayLabel } from '@/shared/dates'
import type { Entry } from '../types/entry'

interface EntryCardProps {
  entry: Entry
  /** 1-based position in the session */
  position: number
  total: number
  today?: string
}

function Chip({ children }: { children: string }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{children}</span>
  )
}

export function EntryCard({ entry, position, total, today }: EntryCardProps) {
  const childLabel = `${entry.children.length} sub-item${entry.children.length === 1 ? '' : 's'}`

  return (
    <article
      aria-label="Entry under review"
      className="rounded-xl border bg-card p-5 text-card-foreground"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDayLabel(entry.date, today)}</span>
        <span>
          {position} of {total}
        </span>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-xl leading-snug">{entry.text}</p>

      {entry.children.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-muted-foreground">{childLabel}</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {entry.children.map((child) => (
              <li key={child}>{child}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {entry.type ? <Chip>{`#${entry.type}`}</Chip> : <Chip>No type yet</Chip>}
        {entry.mirroredTo && <Chip>{`Mirrored to ${entry.mirroredTo.name}`}</Chip>}
      </div>
    </article>
  )
}
