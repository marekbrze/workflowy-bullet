/** `disconnected` = no key stored. */
export type ConnectionStatus = 'disconnected' | 'connected' | 'invalid'

/** The stored link to WorkFlowy: the API key, kept locally. */
export interface ConnectionRecord {
  apiKey: string
  status: 'connected' | 'invalid'
  connectedAt: string
}

export type ConnectPhase = 'verifying' | 'downloading'

export type ConnectResult = { ok: true } | { ok: false; message: string }
