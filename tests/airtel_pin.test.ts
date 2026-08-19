import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import { encryptAirtelPin } from '../src/support/airtel_pin.js'

const MODULUS_BITS = 2048

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: MODULUS_BITS,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

const base64Pem = Buffer.from(publicKey).toString('base64')

function decrypt(encrypted: string): string {
  return crypto
    .privateDecrypt(
      { key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(encrypted, 'base64')
    )
    .toString('utf8')
}

/**
 * Node blocked PKCS#1 v1.5 *private decryption* in 18.19 / 20.11 (CVE-2023-46809,
 * the Marvin attack). Airtel mandates that padding for the PIN, and the encrypt
 * side — the only side this library performs — still works everywhere. So the
 * round-trip check runs only where Node still allows decryption; the structural
 * checks below run everywhere and are what guard the library on every version.
 */
const canDecryptPkcs1 = (() => {
  try {
    decrypt(encryptAirtelPin('probe', base64Pem))
    return true
  } catch {
    return false
  }
})()

describe('encryptAirtelPin', () => {
  it('produces a ciphertext of exactly one RSA block', () => {
    const encrypted = encryptAirtelPin('1234', base64Pem)

    expect(Buffer.from(encrypted, 'base64')).toHaveLength(MODULUS_BITS / 8)
  })

  it('produces a different ciphertext each time, as PKCS1 padding is random', () => {
    expect(encryptAirtelPin('1234', base64Pem)).not.toBe(encryptAirtelPin('1234', base64Pem))
  })

  it('accepts a base64-wrapped PEM, a bare PEM and a bare base64 body alike', () => {
    const bare = publicKey.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '').replace(/\s/g, '')

    for (const key of [base64Pem, publicKey, Buffer.from(bare).toString('base64')]) {
      expect(Buffer.from(encryptAirtelPin('1234', key), 'base64')).toHaveLength(
        MODULUS_BITS / 8
      )
    }
  })

  it('rejects an empty key', () => {
    expect(() => encryptAirtelPin('1234', '')).toThrow('public key is required')
  })

  it('reports what failed when the key is unusable', () => {
    expect(() => encryptAirtelPin('1234', 'bm90LWEta2V5')).toThrow(/PIN encryption failed/)
  })

  it.runIf(canDecryptPkcs1)('round-trips through the matching private key', () => {
    expect(decrypt(encryptAirtelPin('1234', base64Pem))).toBe('1234')
    expect(decrypt(encryptAirtelPin('4321', publicKey))).toBe('4321')
  })
})
