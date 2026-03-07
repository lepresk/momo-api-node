import { describe, it, expect, vi, afterEach } from 'vitest'
import { AirtelDisbursementApi } from '../src/products/AirtelDisbursementApi.js'
import { AirtelConfig } from '../src/models/AirtelConfig.js'

function mockFetch(responses: Array<{ status: number; body: unknown }>) {
  let callCount = 0
  return vi.fn().mockImplementation(() => {
    const response = responses[callCount] ?? responses[responses.length - 1]
    callCount++
    const body = JSON.stringify(response.body)
    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: () => Promise.resolve(response.body),
      text: () => Promise.resolve(body),
    })
  })
}

const airtelTokenSuccess = {
  access_token: 'airtel-test-token-xyz',
  expires_in: 3600,
  token_type: 'Bearer',
}

const airtelTransferPending = {
  data: {
    transaction: {
      id: 'airtel-xfer-001',
      status: 'TIP',
      message: 'Transaction in progress',
      airtel_money_id: null,
    },
  },
}

const airtelTransferSuccessful = {
  data: {
    transaction: {
      id: 'airtel-xfer-001',
      status: 'TS',
      message: 'Transaction successful',
      airtel_money_id: 'AM-XFER-001',
    },
  },
}

const airtelBalance = {
  data: {
    balance: '100000',
    currency: 'XAF',
  },
}

const config = AirtelConfig.disbursement(
  'test-client-id',
  'test-client-secret',
  'encrypted-pin-base64',
  'https://example.com/callback',
)

const BASE_URL = 'https://openapiuat.airtel.cg'

describe('AirtelDisbursementApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('transfer', () => {
    it('returns an externalId (UUID) on success', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: airtelTokenSuccess },
          { status: 200, body: { status: { success: true } } },
        ]),
      )

      const api = new AirtelDisbursementApi(config, BASE_URL)
      const externalId = await api.transfer('10000', '068511358', 'PAY-001')

      expect(typeof externalId).toBe('string')
      expect(externalId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
    })

    it('throws if encryptedPin is missing', async () => {
      const configNoPin = AirtelConfig.disbursement('cid', 'csecret', '')

      const api = new AirtelDisbursementApi(configNoPin, BASE_URL)
      await expect(api.transfer('10000', '068511358', 'PAY-001')).rejects.toThrow(
        'encryptedPin is required',
      )
    })

    it('throws on error response', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: airtelTokenSuccess },
          { status: 400, body: 'Bad request' },
        ]),
      )

      const api = new AirtelDisbursementApi(config, BASE_URL)
      await expect(api.transfer('10000', '068511358', 'PAY-001')).rejects.toThrow()
    })
  })

  describe('getTransferStatus', () => {
    it('returns a pending AirtelTransaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: airtelTokenSuccess },
          { status: 200, body: airtelTransferPending },
        ]),
      )

      const api = new AirtelDisbursementApi(config, BASE_URL)
      const tx = await api.getTransferStatus('airtel-xfer-001')

      expect(tx.isPending()).toBe(true)
      expect(tx.isSuccessful()).toBe(false)
      expect(tx.getId()).toBe('airtel-xfer-001')
    })

    it('returns a successful AirtelTransaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: airtelTokenSuccess },
          { status: 200, body: airtelTransferSuccessful },
        ]),
      )

      const api = new AirtelDisbursementApi(config, BASE_URL)
      const tx = await api.getTransferStatus('airtel-xfer-001')

      expect(tx.isSuccessful()).toBe(true)
      expect(tx.getAirtelMoneyId()).toBe('AM-XFER-001')
    })

    it('throws when transaction is missing in response', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: airtelTokenSuccess },
          { status: 200, body: { data: {} } },
        ]),
      )

      const api = new AirtelDisbursementApi(config, BASE_URL)
      await expect(api.getTransferStatus('airtel-xfer-001')).rejects.toThrow()
    })
  })

  describe('getBalance', () => {
    it('returns an AccountBalance on success', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: airtelTokenSuccess },
          { status: 200, body: airtelBalance },
        ]),
      )

      const api = new AirtelDisbursementApi(config, BASE_URL)
      const balance = await api.getBalance()

      expect(balance.getAvailableBalance()).toBe('100000')
      expect(balance.getCurrency()).toBe('XAF')
    })
  })
})
