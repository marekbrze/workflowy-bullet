export const AUTH_FAILED = 'workflowy-auth-failed'

/** WorkFlowy answered "unauthorized": the key no longer works. */
export class AuthError extends Error {
  constructor(message = 'WorkFlowy no longer accepts this key.') {
    super(message)
    this.name = 'AuthError'
  }
}

/** Any module that gets an auth failure from the API reports it here; the connection reacts. */
export function reportAuthFailure(): void {
  window.dispatchEvent(new CustomEvent(AUTH_FAILED))
}
