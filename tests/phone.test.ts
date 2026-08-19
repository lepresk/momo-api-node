import { describe, it, expect, vi } from 'vitest'
import { jsonResponse, sequence } from './fixtures/fetch.js'
import { cleanPhoneNumber, AIRTEL_COUNTRY_CODES } from '../src/support/phone.js'
import { AirtelCollectionApi } from '../src/products/AirtelCollectionApi.js'
import { AirtelDisbursementApi } from '../src/products/AirtelDisbursementApi.js'
import { AirtelConfig } from '../src/models/AirtelConfig.js'

describe('cleanPhoneNumber', () => {
  it('strips the Congo-Brazzaville country code', () => {
    expect(cleanPhoneNumber('242068511358')).toBe('068511358')
  })

  it('strips formatting before looking for the country code', () => {
    expect(cleanPhoneNumber('+242 06 851 1358')).toBe('068511358')
    expect(cleanPhoneNumber('(242)-06-851-1358')).toBe('068511358')
  })

  it('leaves a local number untouched', () => {
    expect(cleanPhoneNumber('068511358')).toBe('068511358')
  })

  it('accepts a number', () => {
    expect(cleanPhoneNumber(242068511358)).toBe('068511358')
  })

  it('strips only the first matching country code', () => {
    // 242 is stripped; the remaining 435... is left alone even though 243 exists
    expect(cleanPhoneNumber('242243068511')).toBe('243068511')
  })

  it('handles the markets it claims to cover', () => {
    expect(cleanPhoneNumber('254712345678')).toBe('712345678')  // Kenya
    expect(cleanPhoneNumber('243812345678')).toBe('812345678')  // DR Congo
    expect(cleanPhoneNumber('2348012345678')).toBe('8012345678') // Nigeria
    expect(AIRTEL_COUNTRY_CODES).toContain('242')
  })
})



const token = { access_token: 'token', expires_in: 3600 }
const accepted = { data: { transaction: { id: 'x', status: 'TIP' } }, status: { success: true } }

describe('MSISDN sent to Airtel', () => {
  it('drops the country code on requestToPay', async () => {
    const fetchImpl = sequence(jsonResponse(token), jsonResponse(accepted))
    const api = new AirtelCollectionApi(
      AirtelConfig.collection('id', 'secret'),
      'https://airtel.test',
      fetchImpl
    )

    await api.requestToPay('1000', '242068511358', 'ORDER-1')

    const body = JSON.parse(fetchImpl.mock.calls[1][1].body as string)
    expect(body.subscriber.msisdn).toBe('068511358')
  })

  it('drops the country code on transfer', async () => {
    const fetchImpl = sequence(jsonResponse(token), jsonResponse(accepted))
    const api = new AirtelDisbursementApi(
      AirtelConfig.disbursement('id', 'secret', 'pin'),
      'https://airtel.test',
      fetchImpl
    )

    await api.transfer('1000', '242068511358', 'PAY-1')

    const body = JSON.parse(fetchImpl.mock.calls[1][1].body as string)
    expect(body.payee.msisdn).toBe('068511358')
  })

  it('leaves an already-local number alone', async () => {
    const fetchImpl = sequence(jsonResponse(token), jsonResponse(accepted))
    const api = new AirtelCollectionApi(
      AirtelConfig.collection('id', 'secret'),
      'https://airtel.test',
      fetchImpl
    )

    await api.requestToPay('1000', '068511358', 'ORDER-1')

    const body = JSON.parse(fetchImpl.mock.calls[1][1].body as string)
    expect(body.subscriber.msisdn).toBe('068511358')
  })
})
