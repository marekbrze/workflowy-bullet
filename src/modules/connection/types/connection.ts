/** `disconnected` = no key stored. */
export type ConnectionStatus = 'disconnected' | 'connected' | 'invalid'

/** The stored link to WorkFlowy: the API key, kept locally. */
export interface ConnectionRecord {
  apiKey: string
  status: 'connected' | 'invalid'
  connectedAt: string
  /** Which WorkFlowy account the key belongs to; `undefined` for records saved before this was tracked */
  accountId?: string
}

export type ConnectPhase = 'verifying' | 'downloading'

export type ConnectResult =
  | { ok: true }
  | {
      ok: false
      message: string
      /** The key belongs to a different account than the stored one; nothing was changed */
      accountChange?: boolean
      /** The user stopped the attempt; nothing was changed */
      cancelled?: boolean
    }

export type VerifyResult = { ok: true; accountId: string } | { ok: false; message: string }

export interface ConnectOptions {
  /** Go ahead with a key from a different account (the local data of the old one is cleared) */
  allowAccountChange?: boolean
  signal?: AbortSignal
}
