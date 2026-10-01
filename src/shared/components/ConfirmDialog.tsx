import { Button } from '@/components/ui/button'
import { ModalDialog } from './ModalDialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <ModalDialog open={open} title={title} onCancel={onCancel}>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        {/* Cancel comes first so it receives the initial focus — the safe default. */}
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </ModalDialog>
  )
}
