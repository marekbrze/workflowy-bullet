import { readStorage } from '@/shared/lib/storage'
import type { ConnectionRecord } from '../types/connection'
import { createApi, DEFAULT_API_BASE, type WorkflowyApi } from './workflowy-api'

export function getStoredConnection(): ConnectionRecord | null {
  return readStorage<ConnectionRecord[]>('connection', []).value[0] ?? null
}

/** `true` when the app is connected to the real WorkFlowy (not the development demo data). */
export function isLive(): boolean {
  return getStoredConnection()?.mode === 'live'
}

/** An API client for the stored key, or `null` when there is no live connection. */
export function getLiveApi(): WorkflowyApi | null {
  const connection = getStoredConnection()
  if (!connection || connection.mode !== 'live') return null
  return createApi({ baseUrl: DEFAULT_API_BASE, apiKey: connection.apiKey })
}
