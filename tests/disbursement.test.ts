import { describe, it, expect, vi, afterEach } from 'vitest'
import { DisbursementApi } from '../src/products/DisbursementApi.js'
import { Config } from '../src/models/Config.js'
import { PaymentRequest } from '../src/models/PaymentRequest.js'
import { TransferRequest } from '../src/models/TransferRequest.js'
import { RefundRequest } from '../src/models/RefundRequest.js'
import {
  BadRequestException,
  InvalidSubscriptionKeyException,
  ResourceNotFoundException,
} from '../src/exceptions/MomoException.js'
import {
  tokenSuccess,
  depositPending,
  depositSuccessful,
  transferPending,
  transferSuccessful,
  refundPending,
  refundSuccessful,
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

const config = Config.disbursement(
  'test-subscription-key',
  'test-api-user',
  'test-api-key',
  'https://example.com/callback'
)

const BASE_URL = 'https://sandbox.momodeveloper.mtn.com'
const ENVIRONMENT = 'sandbox'

describe('DisbursementApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getAccessToken', () => {
    it('returns an ApiToken on success', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 200, body: tokenSuccess }]))

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const token = await api.getAccessToken()

      expect(token.getAccessToken()).toBe('test-access-token-12345')
      expect(token.getTokenType()).toBe('access_token')
      expect(token.getExpiresIn()).toBe(3600)
    })

    it('throws InvalidSubscriptionKeyException on 401', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 401, body: '' }]))

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      await expect(api.getAccessToken()).rejects.toThrow(InvalidSubscriptionKeyException)
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

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const accountBalance = await api.getBalance()

      expect(accountBalance.getAvailableBalance()).toBe('1000')
      expect(accountBalance.getCurrency()).toBe('EUR')
    })
  })

  describe('deposit', () => {
    it('returns a referenceId on success', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 202, body: '' },
        ])
      )

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const request = PaymentRequest.make('200', '0242439784', 'ext-dep-001', 'EUR', 'Deposit', 'Funds')
      const referenceId = await api.deposit(request)

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

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const request = PaymentRequest.make('200', '0242439784', 'ext-dep-001')
      await expect(api.deposit(request)).rejects.toThrow(BadRequestException)
    })
  })

  describe('getDepositStatus', () => {
    it('returns a pending Transaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 200, body: depositPending },
        ])
      )

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const transaction = await api.getDepositStatus('dep-ref-id')

      expect(transaction.isPending()).toBe(true)
      expect(transaction.getAmount()).toBe('200')
      expect(transaction.getCurrency()).toBe('EUR')
      expect(transaction.getPayee()).toBe('0242439784')
    })

    it('returns a successful Transaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 200, body: depositSuccessful },
        ])
      )

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const transaction = await api.getDepositStatus('dep-ref-id')

      expect(transaction.isSuccessful()).toBe(true)
      expect(transaction.getFinancialTransactionId()).toBe('fin-dep-001')
    })

    it('throws ResourceNotFoundException on 404', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 404, body: 'Not found' },
        ])
      )

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      await expect(api.getDepositStatus('nonexistent')).rejects.toThrow(ResourceNotFoundException)
    })
  })

  describe('transfer', () => {
    it('returns a referenceId on success', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 202, body: '' },
        ])
      )

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const request = TransferRequest.make('300', '0242439784', 'ext-xfer-001', 'EUR', 'Transfer', 'For you')
      const referenceId = await api.transfer(request)

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

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const request = TransferRequest.make('300', '0242439784', 'ext-xfer-001')
      await expect(api.transfer(request)).rejects.toThrow(BadRequestException)
    })
  })

  describe('getTransferStatus', () => {
    it('returns a pending Transaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 200, body: transferPending },
        ])
      )

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const transaction = await api.getTransferStatus('xfer-ref-id')

      expect(transaction.isPending()).toBe(true)
      expect(transaction.getAmount()).toBe('300')
    })

    it('returns a successful Transaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 200, body: transferSuccessful },
        ])
      )

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const transaction = await api.getTransferStatus('xfer-ref-id')

      expect(transaction.isSuccessful()).toBe(true)
      expect(transaction.getFinancialTransactionId()).toBe('fin-xfer-001')
    })
  })

  describe('refund', () => {
    it('returns a referenceId on success', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 202, body: '' },
        ])
      )

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const request = RefundRequest.make('50', 'original-ref-id', 'ext-refund-001', 'EUR')
      const referenceId = await api.refund(request)

      expect(typeof referenceId).toBe('string')
    })
  })

  describe('getRefundStatus', () => {
    it('returns a pending refund Transaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 200, body: refundPending },
        ])
      )

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const transaction = await api.getRefundStatus('refund-ref-id')

      expect(transaction.isPending()).toBe(true)
      expect(transaction.getAmount()).toBe('50')
    })

    it('returns a successful refund Transaction', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch([
          { status: 200, body: tokenSuccess },
          { status: 200, body: refundSuccessful },
        ])
      )

      const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT)
      const transaction = await api.getRefundStatus('refund-ref-id')

      expect(transaction.isSuccessful()).toBe(true)
      expect(transaction.getFinancialTransactionId()).toBe('fin-refund-001')
    })
  })
})
