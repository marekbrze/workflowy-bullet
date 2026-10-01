import type { ConnectionRecord } from '../types/connection'

/** A stored, working connection (seeded as a one-element array like the other single records). */
export function buildConnection(status: ConnectionRecord['status'] = 'connected'): ConnectionRecord[] {
  return [
    {
      apiKey: 'wf-demo-3f9a1c7e5b2d4a60',
      status,
      connectedAt: new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString(),
    },
  ]
}
