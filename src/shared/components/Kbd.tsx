import type { ReactNode } from 'react'

/**
 * A keyboard hint. It is hidden from assistive tech (the control carries `aria-keyshortcuts`
 * instead, so the shortcut is not read as part of its name) and from touch screens.
 */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      aria-hidden="true"
      className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded border bg-muted px-1 font-sans text-xs font-medium uppercase text-muted-foreground [@media(hover:none)]:hidden"
    >
      {children}
    </kbd>
  )
}
