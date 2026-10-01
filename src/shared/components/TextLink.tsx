import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/utils'

/** An in-text link: underlined, brand color on hover, with the shared keyboard focus ring. */
export function TextLink({ className, ...props }: LinkProps) {
  return (
    <Link
      className={cn(
        'inline-block rounded text-sm underline underline-offset-4 hover:text-primary focus-ring',
        className,
      )}
      {...props}
    />
  )
}
