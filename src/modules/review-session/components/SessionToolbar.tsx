import { Button } from '@/components/ui/button'
import { Kbd } from '@/shared/components/Kbd'

interface SessionToolbarProps {
  canSkip: boolean
  canUndo: boolean
  onSkip: () => void
  onUndo: () => void
  onDelete: () => void
}

export function SessionToolbar({ canSkip, canUndo, onSkip, onUndo, onDelete }: SessionToolbarProps) {
  return (
    <div className="mt-6 flex items-center gap-1 border-t pt-3">
      <Button variant="ghost" size="sm" onClick={onSkip} disabled={!canSkip}>
        Skip <Kbd>j</Kbd>
      </Button>
      <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
        Undo <Kbd>k</Kbd>
      </Button>
      <Button variant="ghost" size="sm" className="ml-auto" onClick={onDelete}>
        Delete <Kbd>l</Kbd>
      </Button>
    </div>
  )
}
