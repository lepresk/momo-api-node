import { describe, it, expect } from 'vitest'
import { PaymentRequest } from '../src/models/PaymentRequest.js'
import { TransferRequest } from '../src/models/TransferRequest.js'
import { RefundRequest } from '../src/models/RefundRequest.js'
import { AbstractRequest } from '../src/models/AbstractRequest.js'
import { DEFAULT_CURRENCY } from '../src/models/currency.js'

describe('default currency', () => {
  it('is XAF, matching the PHP client', () => {
    expect(DEFAULT_CURRENCY).toBe('XAF')
  })

  it('applies to PaymentRequest.make', () => {
    const request = PaymentRequest.make('1000', '242068511358', 'ORDER-123')

    expect(request.currency).toBe('XAF')
  })

  it('applies to TransferRequest.make', () => {
    const request = TransferRequest.make('1000', '242068511358', 'PAY-123')

    expect(request.currency).toBe('XAF')
  })

  it('applies to RefundRequest.make', () => {
    const request = RefundRequest.make('1000', 'ref-to-refund', 'REFUND-123')

    expect(request.currency).toBe('XAF')
  })

  it('is overridable', () => {
    expect(PaymentRequest.make('1000', '242068511358', 'ORDER-123', 'EUR').currency).toBe('EUR')
    expect(TransferRequest.make('1000', '242068511358', 'PAY-123', 'EUR').currency).toBe('EUR')
    expect(RefundRequest.make('1000', 'ref', 'REFUND-123', 'EUR').currency).toBe('EUR')
  })
})

describe('shared request shape', () => {
  it('gives every request the same base fields and constructor order', () => {
    const requests = [
      PaymentRequest.make('100', 'party', 'EXT-1', 'XAF', 'hello', 'note'),
      TransferRequest.make('100', 'party', 'EXT-1', 'XAF', 'hello', 'note'),
      RefundRequest.make('100', 'party', 'EXT-1', 'XAF', 'hello', 'note'),
    ]

    for (const request of requests) {
      expect(request).toBeInstanceOf(AbstractRequest)
      expect(request.amount).toBe('100')
      expect(request.currency).toBe('XAF')
      expect(request.externalId).toBe('EXT-1')
      expect(request.payerMessage).toBe('hello')
      expect(request.payeeNote).toBe('note')
    }
  })

  it('defaults the optional message and note to empty strings', () => {
    const request = PaymentRequest.make('100', 'party', 'EXT-1')

    expect(request.payerMessage).toBe('')
    expect(request.payeeNote).toBe('')
  })

  it('serializes the base fields identically across request types', () => {
    const base = { amount: '100', currency: 'XAF', externalId: 'EXT-1', payerMessage: 'hello', payeeNote: 'note' }

    for (const request of [
      PaymentRequest.make('100', 'party', 'EXT-1', 'XAF', 'hello', 'note'),
      TransferRequest.make('100', 'party', 'EXT-1', 'XAF', 'hello', 'note'),
      RefundRequest.make('100', 'party', 'EXT-1', 'XAF', 'hello', 'note'),
    ]) {
      expect(request.toBody()).toMatchObject(base)
    }
  })
})

describe('request bodies', () => {
  it('serializes a payment with the MSISDN payer party', () => {
    const request = PaymentRequest.make('1000', '242068511358', 'ORDER-123', 'XAF', 'hello', 'note')

    expect(request.toBody()).toEqual({
      amount: '1000',
      currency: 'XAF',
      externalId: 'ORDER-123',
      payer: { partyIdType: 'MSISDN', partyId: '242068511358' },
      payerMessage: 'hello',
      payeeNote: 'note',
    })
  })

  it('serializes a transfer with the MSISDN payee party', () => {
    const request = TransferRequest.make('1000', '242068511358', 'PAY-123', 'XAF', 'hello', 'note')

    expect(request.toBody()).toEqual({
      amount: '1000',
      currency: 'XAF',
      externalId: 'PAY-123',
      payee: { partyIdType: 'MSISDN', partyId: '242068511358' },
      payerMessage: 'hello',
      payeeNote: 'note',
    })
  })

  it('serializes a refund with the reference id to refund', () => {
    const request = RefundRequest.make('500', 'origin-ref', 'REFUND-123', 'XAF', 'hello', 'note')

    expect(request.toBody()).toEqual({
      amount: '500',
      currency: 'XAF',
      externalId: 'REFUND-123',
      referenceIdToRefund: 'origin-ref',
      payerMessage: 'hello',
      payeeNote: 'note',
    })
  })
})
