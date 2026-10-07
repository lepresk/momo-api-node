import { describe, it, expect, vi, afterEach } from 'vitest'
import { mockFetch } from './fixtures/fetch.js'
import { tokenSuccess } from './fixtures/index.js'
import { CollectionApi } from '../src/products/CollectionApi.js'
import { DisbursementApi } from '../src/products/DisbursementApi.js'
import { AirtelCollectionApi } from '../src/products/AirtelCollectionApi.js'
import { AirtelDisbursementApi } from '../src/products/AirtelDisbursementApi.js'
import { Config } from '../src/models/Config.js'
import { AirtelConfig } from '../src/models/AirtelConfig.js'
import { PaymentRequest } from '../src/models/PaymentRequest.js'
import { TransferRequest } from '../src/models/TransferRequest.js'
import { RefundRequest } from '../src/models/RefundRequest.js'

// A caller-supplied id lets an orchestrator query, rather than resend, a write
// whose response it never saw (lepresk/momo-api-node#8).

const REFERENCE_ID = '3f1c9a2e-8b4d-4c6f-9a1e-2d7b5c8e0f13'
const MTN_URL = 'https://sandbox.momodeveloper.mtn.com'
const AIRTEL_URL = 'https://openapiuat.airtel.cg'

function stubMtn() {
  const fetchImpl = mockFetch([
    { status: 200, body: tokenSuccess },
    { status: 202, body: '' },
  ])
  vi.stubGlobal('fetch', fetchImpl)
  return fetchImpl
}

function stubAirtel() {
  const fetchImpl = mockFetch([
    { status: 200, body: { access_token: 'airtel-token', expires_in: 3600, token_type: 'Bearer' } },
    { status: 200, body: { status: { success: true } } },
  ])
  vi.stubGlobal('fetch', fetchImpl)
  return fetchImpl
}

function sentReferenceId(fetchImpl: ReturnType<typeof mockFetch>): string {
  return (fetchImpl.mock.calls[1][1].headers as Record<string, string>)['X-Reference-Id']
}

function sentTransactionId(fetchImpl: ReturnType<typeof mockFetch>): string {
  return JSON.parse(fetchImpl.mock.calls[1][1].body as string).transaction.id
}

describe('caller-supplied reference id', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('MTN', () => {
    const collection = () =>
      new CollectionApi(Config.collection('key', 'user', 'secret'), MTN_URL, 'sandbox')
    const disbursement = () =>
      new DisbursementApi(Config.disbursement('key', 'user', 'secret'), MTN_URL, 'sandbox')

    const writes: Array<[string, (id?: string) => Promise<string>]> = [
      ['requestToPay', (id) => collection().requestToPay(PaymentRequest.make('100', '0242439784', 'order-1'), id)],
      ['quickPay', (id) => collection().quickPay('100', '0242439784', 'order-1', 'EUR', id)],
      ['deposit', (id) => disbursement().deposit(PaymentRequest.make('100', '0242439784', 'dep-1'), id)],
      ['transfer', (id) => disbursement().transfer(TransferRequest.make('100', '0242439784', 'xfer-1'), id)],
      ['refund', (id) => disbursement().refund(RefundRequest.make('100', 'original-ref', 'refund-1'), id)],
    ]

    it.each(writes)('%s sends and returns the given reference id', async (_, write) => {
      const fetchImpl = stubMtn()

      const referenceId = await write(REFERENCE_ID)

      expect(referenceId).toBe(REFERENCE_ID)
      expect(sentReferenceId(fetchImpl)).toBe(REFERENCE_ID)
    })

    it.each(writes)('%s rejects a reference id that is not a UUID, sending nothing', async (_, write) => {
      const fetchImpl = stubMtn()

      await expect(write('order-1')).rejects.toThrow('referenceId must be a UUID')
      expect(fetchImpl).not.toHaveBeenCalled()
    })

    it('accepts a deterministic (v5) UUID', async () => {
      const fetchImpl = stubMtn()
      const v5 = '886313e1-3b8a-5372-9b90-0c9aee199e5d'

      await expect(collection().quickPay('100', '0242439784', 'order-1', 'EUR', v5)).resolves.toBe(v5)
      expect(sentReferenceId(fetchImpl)).toBe(v5)
    })

    it.each(writes)('%s generates a fresh UUID without one', async (_, write) => {
      const fetchImpl = stubMtn()

      const referenceId = await write()

      expect(referenceId).not.toBe(REFERENCE_ID)
      expect(referenceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(sentReferenceId(fetchImpl)).toBe(referenceId)
    })
  })

  describe('Airtel', () => {
    const collection = () => new AirtelCollectionApi(AirtelConfig.collection('cid', 'secret'), AIRTEL_URL)
    const disbursement = () =>
      new AirtelDisbursementApi(AirtelConfig.disbursement('cid', 'secret', 'encrypted-pin'), AIRTEL_URL)

    const writes: Array<[string, (id?: string) => Promise<string>]> = [
      ['requestToPay', (id) => collection().requestToPay('5000', '068511358', 'ORDER-001', id)],
      ['transfer', (id) => disbursement().transfer('10000', '068511358', 'PAY-001', id)],
    ]

    it.each(writes)('%s sends and returns the given transaction id', async (_, write) => {
      const fetchImpl = stubAirtel()

      const externalId = await write(REFERENCE_ID)

      expect(externalId).toBe(REFERENCE_ID)
      expect(sentTransactionId(fetchImpl)).toBe(REFERENCE_ID)
    })

    it.each(writes)('%s rejects a transaction id that is not a UUID, sending nothing', async (_, write) => {
      const fetchImpl = stubAirtel()

      await expect(write('BATCH42-0007')).rejects.toThrow('transactionId must be a UUID')
      expect(fetchImpl).not.toHaveBeenCalled()
    })

    it.each(writes)('%s generates a fresh UUID without one', async (_, write) => {
      const fetchImpl = stubAirtel()

      const externalId = await write()

      expect(externalId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(sentTransactionId(fetchImpl)).toBe(externalId)
    })
  })
})
