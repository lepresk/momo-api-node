import { vi } from 'vitest'

/** A JSON `Response` double, enough for what the clients read off one. */
export function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response
}

/** A fetch double answering the given responses in order, repeating the last. */
export function sequence(...responses: Response[]) {
  let call = 0
  return vi.fn().mockImplementation(() => Promise.resolve(responses[call++] ?? responses.at(-1)!))
}

/** `sequence()` from `{status, body}` pairs, for suites that read better that way. */
export function mockFetch(responses: Array<{ status: number; body: unknown }>) {
  return sequence(...responses.map((r) => jsonResponse(r.body, r.status)))
}
