/** Narrow an unknown JSON value to a plain object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Read a string field, treating a missing, empty or non-string value as absent. */
export function optionalString(
  data: Record<string, unknown>,
  key: string
): string | undefined {
  const value = data[key]
  return typeof value === 'string' && value !== '' ? value : undefined
}
