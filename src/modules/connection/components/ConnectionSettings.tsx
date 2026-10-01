import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { formatAgo } from '@/shared/dates'
import { useTransitionFocus } from '@/shared/hooks/use-transition-focus'
import { maskKey } from '../lib/connection'
import type { Connection } from '../hooks/use-connection'
import { ConnectForm } from './ConnectForm'
import { SnapshotStatus } from './SnapshotStatus'

interface ConnectionSettingsProps {
  connection: Connection
  onDisconnected: () => void
}

export function ConnectionSettings({ connection, onDisconnected }: ConnectionSettingsProps) {
  const invalid = connection.status === 'invalid'
  // An invalid key goes straight to the fix.
  const [changing, setChanging] = useState(invalid)
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)
  const [removeLocalData, setRemoveLocalData] = useState(false)
  const [disconnectError, setDisconnectError] = useState<string | null>(null)
  // A key from a different account waits here until the user agrees to clear the old account's data.
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)
  const [switchError, setSwitchError] = useState<string | null>(null)
  // After saving a key the form disappears: put focus on the heading instead of losing it.
  const headingRef = useTransitionFocus<HTMLHeadingElement>(!changing)

  const switchAccount = async () => {
    if (pendingKey === null || switching) return
    setSwitching(true)
    const result = await connection.connect(pendingKey, undefined, { allowAccountChange: true })
    setSwitching(false)
    setPendingKey(null)
    if (result.ok) setChanging(false)
    else setSwitchError(result.message)
  }

  const closeDisconnect = () => {
    setConfirmingDisconnect(false)
    setRemoveLocalData(false)
  }

  return (
    <section aria-labelledby="connection-heading" className="space-y-6">
      <h1 id="connection-heading" ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
        Connection
      </h1>

      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm">
          <span className="text-muted-foreground">Status: </span>
          {/* Meaning is in the words; the color only reinforces it. */}
          <span className={invalid ? 'font-medium text-destructive' : 'font-medium text-success'}>
            {invalid
              ? 'Key not accepted'
              : `Connected to WorkFlowy${connection.connectedAt ? ` · ${formatAgo(connection.connectedAt)}` : ''}`}
          </span>
        </p>
        {connection.apiKey && (
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">API key: </span>
            <code className="font-sans tabular-nums">{maskKey(connection.apiKey)}</code>
          </p>
        )}

        {disconnectError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {disconnectError}
          </p>
        )}

        {changing ? (
          <div className="mt-4">
            <ConnectForm
              submitLabel="Save key"
              error={switchError}
              onSubmit={async (key, onPhase, signal) => {
                setSwitchError(null)
                const result = await connection.connect(key, onPhase, { signal })
                if (result.ok) setChanging(false)
                else if (result.accountChange) setPendingKey(key)
                return result
              }}
              onCancel={invalid ? undefined : () => setChanging(false)}
            />
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setChanging(true)}>
              Change key
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingDisconnect(true)}>
              Disconnect
            </Button>
          </div>
        )}
        {changing && invalid && (
          <div className="mt-3">
            <Button variant="ghost" onClick={() => setConfirmingDisconnect(true)}>
              Disconnect instead
            </Button>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-1 text-sm font-medium">Tree snapshot</h2>
        <SnapshotStatus />
      </div>

      {import.meta.env.DEV && !invalid && (
        <div className="rounded-xl border border-dashed p-4">
          <p className="text-sm text-muted-foreground">Prototype only</p>
          <Button className="mt-2" variant="outline" size="sm" onClick={connection.markInvalid}>
            Simulate: WorkFlowy rejects the key
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pendingKey !== null}
        title="Switch to a different account?"
        description="This key belongs to a different WorkFlowy account. Your local entries, unfinished reviews and pinned and recent places belong to the old one, so they will be cleared."
        confirmLabel={switching ? 'Switching…' : 'Switch and clear local data'}
        destructive
        onConfirm={switchAccount}
        onCancel={() => (switching ? undefined : setPendingKey(null))}
      />

      <ConfirmDialog
        open={confirmingDisconnect}
        title="Disconnect WorkFlowy?"
        description="Your API key and the downloaded tree will be removed from this browser. Your entries, unfinished reviews and pinned and recent places stay here for when you reconnect."
        confirmLabel="Disconnect"
        destructive
        onConfirm={() => {
          const ok = connection.disconnect({ removeLocalData })
          closeDisconnect()
          if (ok) onDisconnected()
          else setDisconnectError("Couldn't remove everything from this browser. Try again.")
        }}
        onCancel={closeDisconnect}
      >
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={removeLocalData}
            onChange={(event) => setRemoveLocalData(event.target.checked)}
            className="mt-0.5 accent-primary"
          />
          <span>Also remove my local data (entries, reviews, pinned and recent places)</span>
        </label>
      </ConfirmDialog>
    </section>
  )
}
