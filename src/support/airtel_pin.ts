import crypto from 'node:crypto'

const PEM_HEADER = '-----BEGIN PUBLIC KEY-----'
const PEM_FOOTER = '-----END PUBLIC KEY-----'

/**
 * Airtel hands out the disbursement public key base64-encoded, sometimes with
 * the PEM armour and sometimes without. Accept either, plus a plain PEM.
 */
function toPem(key: string): string {
  const trimmed = key.trim()
  if (trimmed.includes(PEM_HEADER)) {
    return trimmed
  }

  const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim()
  if (decoded.includes(PEM_HEADER)) {
    return decoded
  }

  const body = decoded.replace(/\s/g, '').match(/.{1,64}/g)?.join('\n') ?? decoded
  return `${PEM_HEADER}\n${body}\n${PEM_FOOTER}`
}

/**
 * Encrypt a disbursement PIN with Airtel's RSA public key.
 *
 * Airtel's transfer endpoint takes an encrypted PIN, never the PIN itself.
 *
 * Airtel mandates PKCS#1 v1.5 padding. Node restricted PKCS#1 v1.5 *decryption*
 * in 18.19 / 20.11 over CVE-2023-46809; encryption, which is all this does, is
 * unaffected. The padding is Airtel's requirement, not a choice made here.
 *
 * ```ts
 * const config = AirtelConfig.disbursement(
 *   clientId,
 *   clientSecret,
 *   encryptAirtelPin('1234', process.env.AIRTEL_PUBLIC_KEY!)
 * )
 * ```
 *
 * @param pin the plain PIN
 * @param publicKey Airtel's public key, base64-encoded or PEM
 * @returns the encrypted PIN, base64-encoded
 */
export function encryptAirtelPin(pin: string, publicKey: string): string {
  if (!publicKey || publicKey.trim() === '') {
    throw new Error('Airtel public key is required to encrypt the PIN')
  }

  try {
    return crypto
      .publicEncrypt(
        { key: toPem(publicKey), padding: crypto.constants.RSA_PKCS1_PADDING },
        Buffer.from(pin, 'utf8')
      )
      .toString('base64')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`PIN encryption failed: ${message}`)
  }
}
