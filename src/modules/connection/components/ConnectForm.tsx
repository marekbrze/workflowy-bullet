import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import type { ConnectPhase, ConnectResult } from '../types/connection'

export type ConnectSubmit = (
  apiKey: string,
  onPhase: (phase: ConnectPhase) => void,
) => Promise<ConnectResult>

interface ConnectFormProps {
  submitLabel?: string
  onSubmit: ConnectSubmit
  onCancel?: () => void
}

const PHASE_TEXT: Record<ConnectPhase, string> = {
  verifying: 'Checking your key…',
  downloading: 'Downloading your WorkFlowy tree…',
}

export function ConnectForm({ submitLabel = 'Connect', onSubmit, onCancel }: ConnectFormProps) {
  const fieldId = useId()
  const [apiKey, setApiKey] = useState('')
  const [phase, setPhase] = useState<ConnectPhase | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busy = phase !== null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setError(null)
    const result = await onSubmit(apiKey, setPhase)
    setPhase(null)
    // On success the parent re-renders without this form. On failure the field stays filled.
    if (!result.ok) setError(result.message)
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={fieldId} className="text-sm font-medium">
        WorkFlowy API key
      </label>
      <input
        id={fieldId}
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={apiKey}
        onChange={(event) => setApiKey(event.target.value)}
        disabled={busy}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      />
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {phase && (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          {PHASE_TEXT[phase]}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={busy}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
