/**
 * Country codes of the Airtel Africa markets, longest-lived first. Airtel's
 * API expects a national MSISDN, so a number carrying one of these must have
 * it removed before the request is sent.
 */
export const AIRTEL_COUNTRY_CODES = [
  '256', // Uganda
  '254', // Kenya
  '255', // Tanzania
  '260', // Zambia
  '250', // Rwanda
  '234', // Nigeria
  '241', // Gabon
  '227', // Niger
  '242', // Congo-Brazzaville
  '243', // DR Congo
  '235', // Chad
  '261', // Madagascar
  '265', // Malawi
  '248', // Seychelles
] as const

/**
 * Strip formatting and, if present, a leading Airtel-market country code.
 *
 * A number that is already national is returned unchanged, so this is safe to
 * apply to any input. Only the first matching code is removed.
 */
export function cleanPhoneNumber(phone: string | number): string {
  const digits = phone.toString().replace(/\D/g, '')

  for (const code of AIRTEL_COUNTRY_CODES) {
    if (digits.startsWith(code)) {
      return digits.slice(code.length)
    }
  }

  return digits
}
