import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
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

  return (
    <section aria-labelledby="connection-heading" className="space-y-6">
      <h1 id="connection-heading" className="text-xl font-semibold">
        Connection
      </h1>

      <div className="rounded-xl border p-4">
        <p className="text-sm">
          <span className="text-muted-foreground">Status: </span>
          {invalid ? 'Key not accepted' : 'Connected to WorkFlowy'}
        </p>
        {connection.apiKey && (
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">API key: </span>
            <code>{maskKey(connection.apiKey)}</code>
          </p>
        )}

        {changing ? (
          <div className="mt-4">
            <ConnectForm
              submitLabel="Save key"
              onSubmit={async (key, onPhase) => {
                const result = await connection.connect(key, onPhase)
                if (result.ok) setChanging(false)
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
          <p className="text-xs text-muted-foreground">Prototype only</p>
          <Button className="mt-2" variant="outline" size="sm" onClick={connection.markInvalid}>
            Simulate: WorkFlowy rejects the key
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmingDisconnect}
        title="Disconnect WorkFlowy?"
        description="Your API key and the downloaded tree will be removed from this browser. Unfinished sessions and your pinned and recent places are kept for when you reconnect."
        confirmLabel="Disconnect"
        destructive
        onConfirm={() => {
          setConfirmingDisconnect(false)
          connection.disconnect()
          onDisconnected()
        }}
        onCancel={() => setConfirmingDisconnect(false)}
      />
    </section>
  )
}
