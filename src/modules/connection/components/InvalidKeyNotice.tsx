import { Button } from '@/components/ui/button'

interface InvalidKeyNoticeProps {
  onChangeKey: () => void
  /** Shown when a review session was interrupted */
  interruptedSession?: boolean
}

export function InvalidKeyNotice({ onChangeKey, interruptedSession }: InvalidKeyNoticeProps) {
  return (
    <section
      role="alert"
      aria-labelledby="invalid-key-heading"
      className="rounded-xl border border-destructive/40 bg-destructive/10 p-5"
    >
      <h1 id="invalid-key-heading" className="text-lg font-semibold">
        WorkFlowy no longer accepts this key
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {interruptedSession
          ? 'Your session is paused and nothing was lost. Enter a working key to carry on where you stopped.'
          : 'Your data and any unfinished session are kept. Enter a working key to carry on.'}
      </p>
      <Button className="mt-4" onClick={onChangeKey}>
        Change key
      </Button>
    </section>
  )
}
