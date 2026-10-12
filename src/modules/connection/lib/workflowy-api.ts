import { AuthError } from './auth'

/** A node as the WorkFlowy API returns it. `name` is inline HTML (`<b>`, `<a>`, `<time …>`, …). */
export interface WorkflowyNode {
  id: string
  parent_id: string | null
  name: string
  note: string | null
  /** Sort order among siblings. Lists come back unordered: sort by this. */
  priority: number
  completed: boolean
  data?: { layoutMode?: string }
  createdAt: number
  modifiedAt: number
  completedAt: number | null
}

export interface ApiConfig {
  /** Where requests go: the same-origin proxy by default, or the API itself from a server. */
  baseUrl: string
  apiKey: string
  /**
   * `x-workflowy-key` for the proxy (it adds the `Authorization` header — CapRover's Basic Auth
   * also uses that header, so the browser must not send it); `authorization` to call the API directly.
   */
  keyHeader?: 'x-workflowy-key' | 'authorization'
}

/** The WorkFlowy API could not be reached (offline, DNS, proxy down). */
export class NetworkError extends Error {
  constructor(message = "Couldn't reach WorkFlowy.") {
    super(message)
    this.name = 'NetworkError'
  }
}

/** `/nodes-export` is limited to one request per minute. */
export class RateLimitError extends Error {
  constructor(message = 'WorkFlowy allows one refresh per minute.') {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Where the app talks to WorkFlowy. Override with `VITE_WORKFLOWY_API` (e.g. to call another proxy). */
export const DEFAULT_API_BASE = import.meta.env?.VITE_WORKFLOWY_API ?? '/api/workflowy'

export type Fetch = typeof fetch

export function createApi(config: ApiConfig, fetchImpl: Fetch = (...args) => fetch(...args)) {
  const { baseUrl, apiKey, keyHeader = 'x-workflowy-key' } = config

  async function request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    options: { query?: Record<string, string>; body?: unknown; signal?: AbortSignal } = {},
  ): Promise<T> {
    const query = options.query ? `?${new URLSearchParams(options.query)}` : ''
    const target = `${baseUrl.replace(/\/$/, '')}${path}${query}`
    const headers: Record<string, string> = { Accept: 'application/json' }
    headers[keyHeader] = keyHeader === 'authorization' ? `Bearer ${apiKey}` : apiKey
    if (options.body !== undefined) headers['Content-Type'] = 'application/json'

    let response: Response
    try {
      response = await fetchImpl(target, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw new NetworkError()
    }

    if (response.status === 401 || response.status === 403) throw new AuthError()
    if (response.status === 429) throw new RateLimitError()
    if (!response.ok) {
      let detail = ''
      try {
        detail = (await response.text()).slice(0, 200)
      } catch {
        // No body to report.
      }
      throw new ApiError(response.status, `WorkFlowy answered ${response.status}${detail ? `: ${detail}` : ''}`)
    }
    return (await response.json()) as T
  }

  return {
    /** A cheap authenticated call: the way to check that a key works. */
    listTargets: (signal?: AbortSignal) =>
      request<{ targets: { key: string; type: string; name: string | null }[] }>('GET', '/targets', { signal }),
    /** `id` may be a node id or a target: "today", "tomorrow", "calendar", "inbox", "YYYY-MM-DD". */
    getNode: async (id: string, signal?: AbortSignal) =>
      (await request<{ node: WorkflowyNode }>('GET', `/nodes/${encodeURIComponent(id)}`, { signal })).node,
    listChildren: async (parentId: string, signal?: AbortSignal) =>
      (await request<{ nodes: WorkflowyNode[] }>('GET', '/nodes', { query: { parent_id: parentId }, signal })).nodes,
    /** The whole tree, flat. Limited to one request per minute and a few MB. */
    exportNodes: async (signal?: AbortSignal) =>
      (await request<{ nodes: WorkflowyNode[] }>('GET', '/nodes-export', { signal })).nodes,
    createNode: async (
      input: { parent_id: string; name: string; note?: string; position?: 'top' | 'bottom'; layoutMode?: string },
      signal?: AbortSignal,
    ) => (await request<{ item_id: string }>('POST', '/nodes', { body: input, signal })).item_id,
    updateNode: (id: string, input: { name?: string; note?: string; layoutMode?: string }, signal?: AbortSignal) =>
      request<{ status: string }>('POST', `/nodes/${encodeURIComponent(id)}`, { body: input, signal }),
    deleteNode: (id: string, signal?: AbortSignal) =>
      request<{ status: string }>('DELETE', `/nodes/${encodeURIComponent(id)}`, { signal }),
    completeNode: (id: string, signal?: AbortSignal) =>
      request<{ status: string }>('POST', `/nodes/${encodeURIComponent(id)}/complete`, { signal }),
    uncompleteNode: (id: string, signal?: AbortSignal) =>
      request<{ status: string }>('POST', `/nodes/${encodeURIComponent(id)}/uncomplete`, { signal }),
    /** Creates a mirror of `id` under `parentId` (a full node id). Returns the mirror's item id. */
    mirrorNode: async (id: string, parentId: string, signal?: AbortSignal) =>
      (await request<{ item_id: string; origin_id: string }>('POST', `/nodes/${encodeURIComponent(id)}/mirror`, {
        body: { parent_id: parentId },
        signal,
      })).item_id,
    /** Removes a mirror (the id of the mirror itself); the original stays. */
    deleteMirror: (mirrorId: string, signal?: AbortSignal) =>
      request<{ status: string }>('DELETE', `/nodes/${encodeURIComponent(mirrorId)}/mirror`, { signal }),
  }
}

export type WorkflowyApi = ReturnType<typeof createApi>
