import { useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import type { ConnectPhase, ConnectResult } from '../types/connection'

export type ConnectSubmit = (
  apiKey: string,
  onPhase: (phase: ConnectPhase) => void,
  signal?: AbortSignal,
) => Promise<ConnectResult>

interface ConnectFormProps {
  submitLabel?: string
  onSubmit: ConnectSubmit
  onCancel?: () => void
  /** Shown above the field, e.g. a problem reported by the caller */
  error?: string | null
}

const PHASE_TEXT: Record<ConnectPhase, string> = {
  verifying: 'Checking your key…',
  downloading: 'Downloading your WorkFlowy tree…',
}

export function ConnectForm({
  submitLabel = 'Connect',
  onSubmit,
  onCancel,
  error: outerError = null,
}: ConnectFormProps) {
  const fieldId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [phase, setPhase] = useState<ConnectPhase | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busy = phase !== null
  const shownError = error ?? outerError

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    // An empty field is rejected on the spot, without a "checking" round trip.
    if (!apiKey.trim()) {
      setError('Enter your API key to continue.')
      inputRef.current?.focus()
      return
    }
    setError(null)
    const controller = new AbortController()
    abortRef.current = controller
    const result = await onSubmit(apiKey, setPhase, controller.signal)
    abortRef.current = null
    setPhase(null)
    // On success the parent re-renders without this form. On failure the field stays filled;
    // a cancelled attempt is not an error.
    if (!result.ok && !result.cancelled) setError(result.message)
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={fieldId} className="text-sm font-medium">
        WorkFlowy API key
      </label>
      <div className="mt-1 flex gap-2">
        <input
          ref={inputRef}
          id={fieldId}
          type={revealed ? 'text' : 'password'}
          autoComplete="off"
          spellCheck={false}
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          disabled={busy}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={shownError ? `${fieldId}-error` : undefined}
          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-ring disabled:opacity-50"
        />
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-pressed={revealed}
          onClick={() => setRevealed((value) => !value)}
        >
          {revealed ? 'Hide' : 'Show'}
        </Button>
      </div>
      {shownError && (
        <p id={`${fieldId}-error`} role="alert" className="mt-2 text-sm text-destructive">
          {shownError}
        </p>
      )}
      {phase && (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          {PHASE_TEXT[phase]}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <Button type="submit" size="lg" disabled={busy}>
          {submitLabel}
        </Button>
        {/* While connecting, Cancel stops the attempt; the previous connection stays untouched. */}
        {busy ? (
          <Button type="button" variant="ghost" size="lg" onClick={() => abortRef.current?.abort()}>
            Cancel
          </Button>
        ) : (
          onCancel && (
            <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
              Cancel
            </Button>
          )
        )}
      </div>
    </form>
  )
}
