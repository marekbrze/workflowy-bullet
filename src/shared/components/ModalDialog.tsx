import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalDialogProps {
  open: boolean
  title: string
  /** Fired when the user presses Esc. The dialog stays open until `open` becomes false. */
  onCancel: () => void
  children: ReactNode
}

/** Native <dialog>: focus trap, Esc and backdrop come from the browser. */
export function ModalDialog({ open, title, onCancel, children }: ModalDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border bg-popover p-6 text-foreground backdrop:bg-scrim"
    >
      {open && (
        <>
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          {children}
        </>
      )}
    </dialog>
  )
}
