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
      <Button variant="ghost" size="sm" onClick={onSkip} disabled={disabled || !canSkip} aria-keyshortcuts="j">
        Skip <Kbd>j</Kbd>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        disabled={disabled || !canUndo}
        title={undoLabel ? `Undo: ${undoLabel}` : undefined}
        aria-label={undoLabel ? `Undo: ${undoLabel}` : 'Undo'}
        aria-keyshortcuts="k"
      >
        Undo <Kbd>k</Kbd>
      </Button>
      {canChangeType && (
        <Button variant="ghost" size="sm" onClick={onChangeType} disabled={disabled} aria-keyshortcuts="g">
          Change type <Kbd>g</Kbd>
        </Button>
      )}
      <Button variant="ghost" size="sm" className="ml-auto" onClick={onDelete} disabled={disabled} aria-keyshortcuts="l">
        Delete <Kbd>l</Kbd>
      </Button>
    </div>
  )
}
