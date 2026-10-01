import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { STORAGE_WRITE_FAILED } from '@/shared/lib/storage'

/** App-wide safety net: shown when any LocalStorage write did not go through. */
export function StorageFailureBanner() {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const onFailure = () => setFailed(true)
    window.addEventListener(STORAGE_WRITE_FAILED, onFailure)
    return () => window.removeEventListener(STORAGE_WRITE_FAILED, onFailure)
  }, [])

  if (!failed) return null
  return <StorageFailureNotice onDismiss={() => setFailed(false)} />
}

export function StorageFailureNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div role="alert" className="border-b border-destructive/40 bg-destructive/10">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-2">
        <p className="text-sm">
          Your last change could not be saved in this browser. Storage may be full or blocked.
        </p>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
