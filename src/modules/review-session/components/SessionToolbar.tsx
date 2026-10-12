import { Button } from '@/components/ui/button'
import { Kbd } from '@/shared/components/Kbd'

interface SessionToolbarProps {
  canSkip: boolean
  canUndo: boolean
  /** What Undo would revert, e.g. "marked done" */
  undoLabel?: string | null
  /** Only offered when the entry already has a type to correct */
  canChangeType?: boolean
  /** Locks everything, e.g. while a failed write waits for a retry */
  disabled?: boolean
  onSkip: () => void
  onUndo: () => void
  onChangeType?: () => void
  onDelete: () => void
}

export function SessionToolbar({
  canSkip,
  canUndo,
  undoLabel,
  canChangeType,
  disabled,
  onSkip,
  onUndo,
  onChangeType,
  onDelete,
}: SessionToolbarProps) {
  return (
    <div className="mt-6 flex items-center gap-1 border-t pt-3">
      <Button variant="ghost" size="sm" onClick={onDelete} disabled={disabled} aria-keyshortcuts="a">
        Delete <Kbd>a</Kbd>
      </Button>
      {canChangeType && (
        <Button variant="ghost" size="sm" onClick={onChangeType} disabled={disabled} aria-keyshortcuts="s">
          Change type <Kbd>s</Kbd>
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto"
        onClick={onUndo}
        disabled={disabled || !canUndo}
        title={undoLabel ? `Undo: ${undoLabel}` : undefined}
        aria-label={undoLabel ? `Undo: ${undoLabel}` : 'Undo'}
        aria-keyshortcuts="d"
      >
        Undo <Kbd>d</Kbd>
      </Button>
      <Button variant="ghost" size="sm" onClick={onSkip} disabled={disabled || !canSkip} aria-keyshortcuts="f">
        Skip <Kbd>f</Kbd>
      </Button>
    </div>
  )
}
