import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CollectionApi } from '../src/products/CollectionApi.js'
import { Config } from '../src/models/Config.js'
import { PaymentRequest } from '../src/models/PaymentRequest.js'
import {
  BadRequestException,
  InvalidSubscriptionKeyException,
  ResourceNotFoundException,
} from '../src/exceptions/MomoException.js'
import {
  tokenSuccess,
  paymentPending,
  paymentSuccessful,
  paymentFailed,
  balance,
} from './fixtures/index.js'

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

const config = Config.collection(
  'test-subscription-key',
  'test-api-user',
  'test-api-key',
  'https://example.com/callback'
)

const BASE_URL = 'https://sandbox.momodeveloper.mtn.com'
const ENVIRONMENT = 'sandbox'

describe('CollectionApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getAccessToken', () => {
    it('returns an ApiToken on success', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 200, body: tokenSuccess }]))

      const api = new CollectionApi(config, BASE_URL, ENVIRONMENT)
      const token = await api.getAccessToken()

      expect(token.getAccessToken()).toBe('test-access-token-12345')
      expect(token.getTokenType()).toBe('access_token')
      expect(token.getExpiresIn()).toBe(3600)
    })

    it('throws InvalidSubscriptionKeyException on 401', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 401, body: '' }]))

      const api = new CollectionApi(config, BASE_URL, ENVIRONMENT)
      await expect(api.getAccessToken()).rejects.toThrow(InvalidSubscriptionKeyException)
    })
  })

  describe('requestToPay', () => {
    it('returns a referenceId on success', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 202, body: '' },
        ])
      )

      const api = new CollectionApi(config, BASE_URL, ENVIRONMENT)
      const request = PaymentRequest.make('100', '0242439784', 'ext-ref-001', 'EUR', 'Test', 'Note')
      const referenceId = await api.requestToPay(request)

      expect(typeof referenceId).toBe('string')
      expect(referenceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('throws BadRequestException on 400', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 400, body: 'Bad request' },
        ])
      )

      const api = new CollectionApi(config, BASE_URL, ENVIRONMENT)
      const request = PaymentRequest.make('100', '0242439784', 'ext-ref-001')
      await expect(api.requestToPay(request)).rejects.toThrow(BadRequestException)
    })
  })

  describe('getPaymentStatus', () => {
    it('returns a pending Transaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 200, body: paymentPending },
        ])
      )

      const api = new CollectionApi(config, BASE_URL, ENVIRONMENT)
      const transaction = await api.getPaymentStatus('some-payment-id')

      expect(transaction.isPending()).toBe(true)
      expect(transaction.isSuccessful()).toBe(false)
      expect(transaction.isFailed()).toBe(false)
      expect(transaction.getStatus()).toBe('PENDING')
      expect(transaction.getAmount()).toBe('100')
      expect(transaction.getCurrency()).toBe('EUR')
      expect(transaction.getPayer()).toBe('0242439784')
      expect(transaction.getFinancialTransactionId()).toBeNull()
    })

    it('returns a successful Transaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 200, body: paymentSuccessful },
        ])
      )

      const api = new CollectionApi(config, BASE_URL, ENVIRONMENT)
      const transaction = await api.getPaymentStatus('some-payment-id')

      expect(transaction.isSuccessful()).toBe(true)
      expect(transaction.isPending()).toBe(false)
      expect(transaction.isFailed()).toBe(false)
      expect(transaction.getFinancialTransactionId()).toBe('fin-txn-001')
    })

    it('returns a failed Transaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 200, body: paymentFailed },
        ])
      )

      const api = new CollectionApi(config, BASE_URL, ENVIRONMENT)
      const transaction = await api.getPaymentStatus('some-payment-id')

      expect(transaction.isFailed()).toBe(true)
      expect(transaction.isSuccessful()).toBe(false)
    })

    it('throws ResourceNotFoundException on 404', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 404, body: 'Not found' },
        ])
      )

      const api = new CollectionApi(config, BASE_URL, ENVIRONMENT)
      await expect(api.getPaymentStatus('nonexistent-id')).rejects.toThrow(
        ResourceNotFoundException
      )
    })
  })

  describe('getBalance', () => {
    it('returns an AccountBalance on success', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 200, body: balance },
        ])
      )

      const api = new CollectionApi(config, BASE_URL, ENVIRONMENT)
      const accountBalance = await api.getBalance()

      expect(accountBalance.getAvailableBalance()).toBe('1000')
      expect(accountBalance.getCurrency()).toBe('EUR')
    })
  })

  describe('quickPay', () => {
    it('returns a referenceId on success', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 202, body: '' },
        ])
      )

      const api = new CollectionApi(config, BASE_URL, ENVIRONMENT)
      const referenceId = await api.quickPay('50', '0242439784', 'quick-ref-001', 'EUR')

      expect(typeof referenceId).toBe('string')
      expect(referenceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })
  })
})
