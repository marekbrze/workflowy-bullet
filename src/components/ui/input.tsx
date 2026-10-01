import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** The one text field: 36px tall, a ≥3:1 boundary, brand focus ring. */
export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm focus-ring disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
