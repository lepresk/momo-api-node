import { describe, it, expect, vi, afterEach } from 'vitest'
import { AirtelCollectionApi } from '../src/products/AirtelCollectionApi.js'
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

const airtelPaymentPending = {
  data: {
    transaction: {
      id: 'airtel-ext-001',
      status: 'TIP',
      message: 'Transaction in progress',
      airtel_money_id: null,
    },
  },
}

const airtelPaymentSuccessful = {
  data: {
    transaction: {
      id: 'airtel-ext-001',
      status: 'TS',
      message: 'Transaction successful',
      airtel_money_id: 'AM-001',
    },
  },
}

const airtelPaymentFailed = {
  data: {
    transaction: {
      id: 'airtel-ext-001',
      status: 'TF',
      message: 'Transaction failed',
      airtel_money_id: null,
    },
  },
}

const airtelBalance = {
  data: {
    balance: '50000',
    currency: 'XAF',
  },
}

const config = AirtelConfig.collection(
  'test-client-id',
  'test-client-secret',
  'https://example.com/callback',
)

const BASE_URL = 'https://openapiuat.airtel.cg'

describe('AirtelCollectionApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getAccessToken', () => {
    it('returns a token string on success', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 200, body: airtelTokenSuccess }]))

      const api = new AirtelCollectionApi(config, BASE_URL)
      const token = await api.getAccessToken()

      expect(token).toBe('airtel-test-token-xyz')
    })

    it('caches the token and avoids a second fetch', async () => {
      const fetchMock = mockFetch([{ status: 200, body: airtelTokenSuccess }])
      vi.stubGlobal('fetch', fetchMock)

      const api = new AirtelCollectionApi(config, BASE_URL)
      const token1 = await api.getAccessToken()
      const token2 = await api.getAccessToken()

      expect(token1).toBe(token2)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('throws on 401', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 401, body: '' }]))

      const api = new AirtelCollectionApi(config, BASE_URL)
      await expect(api.getAccessToken()).rejects.toThrow()
    })
  })

  describe('requestToPay', () => {
    it('returns an externalId (UUID) on success', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: airtelTokenSuccess },
          { status: 200, body: { status: { success: true } } },
        ]),
      )

      const api = new AirtelCollectionApi(config, BASE_URL)
      const externalId = await api.requestToPay('5000', '068511358', 'ORDER-001')

      expect(typeof externalId).toBe('string')
      expect(externalId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
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

      const api = new AirtelCollectionApi(config, BASE_URL)
      await expect(api.requestToPay('5000', '068511358', 'ORDER-001')).rejects.toThrow()
    })
  })

  describe('getPaymentStatus', () => {
    it('returns a pending AirtelTransaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: airtelTokenSuccess },
          { status: 200, body: airtelPaymentPending },
        ]),
      )

      const api = new AirtelCollectionApi(config, BASE_URL)
      const tx = await api.getPaymentStatus('airtel-ext-001')

      expect(tx.isPending()).toBe(true)
      expect(tx.isSuccessful()).toBe(false)
      expect(tx.isFailed()).toBe(false)
      expect(tx.getStatus()).toBe('TIP')
      expect(tx.getId()).toBe('airtel-ext-001')
      expect(tx.getAirtelMoneyId()).toBeNull()
    })

    it('returns a successful AirtelTransaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: airtelTokenSuccess },
          { status: 200, body: airtelPaymentSuccessful },
        ]),
      )

      const api = new AirtelCollectionApi(config, BASE_URL)
      const tx = await api.getPaymentStatus('airtel-ext-001')

      expect(tx.isSuccessful()).toBe(true)
      expect(tx.isPending()).toBe(false)
      expect(tx.isFailed()).toBe(false)
      expect(tx.getAirtelMoneyId()).toBe('AM-001')
    })

    it('returns a failed AirtelTransaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: airtelTokenSuccess },
          { status: 200, body: airtelPaymentFailed },
        ]),
      )

      const api = new AirtelCollectionApi(config, BASE_URL)
      const tx = await api.getPaymentStatus('airtel-ext-001')

      expect(tx.isFailed()).toBe(true)
      expect(tx.isSuccessful()).toBe(false)
    })

    it('throws on 404', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: airtelTokenSuccess },
          { status: 404, body: 'Not found' },
        ]),
      )

      const api = new AirtelCollectionApi(config, BASE_URL)
      await expect(api.getPaymentStatus('nonexistent')).rejects.toThrow()
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

      const api = new AirtelCollectionApi(config, BASE_URL)
      const balance = await api.getBalance()

      expect(balance.getAvailableBalance()).toBe('50000')
      expect(balance.getCurrency()).toBe('XAF')
    })
  })
})
