import { randomUUID } from 'node:crypto'

// Any version: callers may derive a deterministic v5 UUID from a business key
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function generateUUID(): string {
  return randomUUID()
}

/** Throw unless `value` is a UUID, before anything is sent. */
export function assertUUID(value: string, name: string): void {
  if (!UUID_PATTERN.test(value)) {
    throw new Error(`${name} must be a UUID, got "${value}"`)
  }
}
