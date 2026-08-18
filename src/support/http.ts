import { createException } from '../exceptions/MomoException.js'

/**
 * A `fetch`-compatible function. Supply your own to add timeouts, retries,
 * proxying or instrumentation, or to test without touching the network.
 */
export type FetchLike = typeof fetch

/**
 * Defer to the global `fetch` at call time rather than capturing it, so tests
 * that swap `globalThis.fetch` still work on already-built clients.
 */
const globalFetch: FetchLike = (input, init) => globalThis.fetch(input, init)

export function resolveFetch(fetchImpl?: FetchLike): FetchLike {
  return fetchImpl ?? globalFetch
}

async function fail(response: Response): Promise<never> {
  const text = await response.text().catch(() => '')
  throw createException(response.status, text || undefined)
}

/**
 * Require an exact status code. The MTN write endpoints answer `202 Accepted`
 * with an empty body; any other status — including another 2xx — is a failure.
 */
export async function assertStatus(response: Response, expected: number): Promise<void> {
  if (response.status !== expected) {
    await fail(response)
  }
}

/** Read a JSON body, raising the matching {@link MomoException} on failure. */
export async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    await fail(response)
  }
  return response.json() as Promise<T>
}

/** Like {@link readJson}, but tolerates the empty bodies the sandbox returns. */
export async function readJsonAllowEmpty<T>(response: Response): Promise<T> {
  if (!response.ok) {
    await fail(response)
  }
  const text = await response.text()
  return text ? (JSON.parse(text) as T) : ({} as T)
}
