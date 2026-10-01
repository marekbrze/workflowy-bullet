import type { ReactNode } from 'react'

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded border bg-muted px-1 font-sans text-xs font-medium uppercase text-muted-foreground">
      {children}
    </kbd>
  )
}
