import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface WriteErrorNoticeProps {
  onRetry: () => void
}

export function WriteErrorNotice({ onRetry }: WriteErrorNoticeProps) {
  const retryRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    retryRef.current?.focus()
  }, [])

  return (
    <div role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
      <p className="text-sm font-medium">That didn&rsquo;t reach WorkFlowy.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Nothing was changed. Check your connection and try again.
      </p>
      <Button ref={retryRef} className="mt-3" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
