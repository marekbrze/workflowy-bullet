import type { ConnectResult } from '../types/connection'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Mocked WorkFlowy key check. Rules a tester can rely on:
 * - an empty key, a key shorter than 8 characters, or one containing "invalid" is rejected;
 * - a key containing "offline" simulates a network failure;
 * - anything else is accepted.
 */
export async function verifyApiKey(key: string, ms = 600): Promise<ConnectResult> {
  await delay(ms)
  const trimmed = key.trim()
  if (!trimmed) return { ok: false, message: 'Enter your API key to continue.' }
  if (trimmed.includes('offline')) {
    return { ok: false, message: "Couldn't reach WorkFlowy. Check your connection and try again." }
  }
  if (trimmed.length < 8 || trimmed.includes('invalid')) {
    return {
      ok: false,
      message: 'WorkFlowy did not accept this key. Check that you copied all of it.',
    }
  }
  return { ok: true }
}

/** Mocked `/nodes-export` download. */
export async function downloadTree(ms = 900): Promise<void> {
  await delay(ms)
}

export function maskKey(key: string): string {
  if (key.length <= 8) return '••••'
  return `${key.slice(0, 3)}••••${key.slice(-4)}`
}
