import type { ReactNode } from 'react'

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[0.7rem] uppercase text-muted-foreground">
      {children}
    </kbd>
  )
}
