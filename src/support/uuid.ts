export function generateUUID(): string {
  return globalThis.crypto.randomUUID()
}

