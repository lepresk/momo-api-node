import { describe, it, expect } from 'vitest'
import { ErrorReason } from '../src/models/ErrorReason.js'
import { Transaction } from '../src/models/Transaction.js'

describe('ErrorReason', () => {
  it('exposes code and message parsed from the API payload', () => {
    const reason = ErrorReason.fromObject({
      code: 'NOT_ENOUGH_FUNDS',
      message: 'Payer has insufficient funds',
    })

    expect(reason.getCode()).toBe('NOT_ENOUGH_FUNDS')
    expect(reason.getMessage()).toBe('Payer has insufficient funds')
  })

  it('defaults code and message to empty strings when absent', () => {
    const reason = ErrorReason.fromObject({})

    expect(reason.getCode()).toBe('')
    expect(reason.getMessage()).toBe('')
  })

  it('matches a code with is()', () => {
    const reason = ErrorReason.fromObject({ code: 'EXPIRED', message: '' })

    expect(reason.is(ErrorReason.EXPIRED)).toBe(true)
    expect(reason.is(ErrorReason.APPROVAL_REJECTED)).toBe(false)
  })

  it('provides a predicate for every code, not an arbitrary subset', () => {
    const predicates: Array<[string, keyof ErrorReason]> = [
      ['PAYEE_NOT_FOUND', 'isPayeeNotFound'],
      ['PAYER_NOT_FOUND', 'isPayerNotFound'],
      ['NOT_ALLOWED', 'isNotAllowed'],
      ['NOT_ALLOWED_TARGET_ENVIRONMENT', 'isNotAllowedTargetEnvironment'],
      ['INVALID_CALLBACK_URL_HOST', 'isInvalidCallbackUrlHost'],
      ['INVALID_CURRENCY', 'isInvalidCurrency'],
      ['SERVICE_UNAVAILABLE', 'isServiceUnavailable'],
      ['INTERNAL_PROCESSING_ERROR', 'isInternalProcessingError'],
      ['NOT_ENOUGH_FUNDS', 'isNotEnoughFunds'],
      ['PAYER_LIMIT_REACHED', 'isPayerLimitReached'],
      ['PAYEE_NOT_ALLOWED_TO_RECEIVE', 'isPayeeNotAllowedToReceive'],
      ['PAYMENT_NOT_APPROVED', 'isPaymentNotApproved'],
      ['RESOURCE_NOT_FOUND', 'isResourceNotFound'],
      ['APPROVAL_REJECTED', 'isApprovalRejected'],
      ['EXPIRED', 'isExpired'],
      ['TRANSACTION_CANCELED', 'isTransactionCanceled'],
      ['RESOURCE_ALREADY_EXIST', 'isResourceAlreadyExist'],
    ]

    for (const [code, predicate] of predicates) {
      const reason = ErrorReason.fromObject({ code, message: '' })
      const method = reason[predicate] as () => boolean

      expect(typeof method, `missing predicate: ${predicate}`).toBe('function')
      expect(method.call(reason), `${predicate} should match ${code}`).toBe(true)
    }
  })

  it('returns false from a predicate that does not match', () => {
    const reason = ErrorReason.fromObject({ code: 'EXPIRED', message: '' })

    expect(reason.isExpired()).toBe(true)
    expect(reason.isNotEnoughFunds()).toBe(false)
    expect(reason.isPayerLimitReached()).toBe(false)
  })

  it('renders as [CODE] message', () => {
    const reason = ErrorReason.fromObject({ code: 'EXPIRED', message: 'Transaction expired' })

    expect(String(reason)).toBe('[EXPIRED] Transaction expired')
  })

  it('exposes every MTN failure code as a constant', () => {
    expect(ErrorReason.PAYEE_NOT_FOUND).toBe('PAYEE_NOT_FOUND')
    expect(ErrorReason.PAYER_NOT_FOUND).toBe('PAYER_NOT_FOUND')
    expect(ErrorReason.NOT_ALLOWED).toBe('NOT_ALLOWED')
    expect(ErrorReason.NOT_ALLOWED_TARGET_ENVIRONMENT).toBe('NOT_ALLOWED_TARGET_ENVIRONMENT')
    expect(ErrorReason.INVALID_CALLBACK_URL_HOST).toBe('INVALID_CALLBACK_URL_HOST')
    expect(ErrorReason.INVALID_CURRENCY).toBe('INVALID_CURRENCY')
    expect(ErrorReason.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE')
    expect(ErrorReason.INTERNAL_PROCESSING_ERROR).toBe('INTERNAL_PROCESSING_ERROR')
    expect(ErrorReason.NOT_ENOUGH_FUNDS).toBe('NOT_ENOUGH_FUNDS')
    expect(ErrorReason.PAYER_LIMIT_REACHED).toBe('PAYER_LIMIT_REACHED')
    expect(ErrorReason.PAYEE_NOT_ALLOWED_TO_RECEIVE).toBe('PAYEE_NOT_ALLOWED_TO_RECEIVE')
    expect(ErrorReason.PAYMENT_NOT_APPROVED).toBe('PAYMENT_NOT_APPROVED')
    expect(ErrorReason.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND')
    expect(ErrorReason.APPROVAL_REJECTED).toBe('APPROVAL_REJECTED')
    expect(ErrorReason.EXPIRED).toBe('EXPIRED')
    expect(ErrorReason.TRANSACTION_CANCELED).toBe('TRANSACTION_CANCELED')
    expect(ErrorReason.RESOURCE_ALREADY_EXIST).toBe('RESOURCE_ALREADY_EXIST')
  })
})

describe('Transaction.getReason', () => {
  it('returns the parsed reason of a failed transaction', () => {
    const transaction = Transaction.parse({
      externalId: 'ext-ref-001',
      amount: '100',
      currency: 'EUR',
      status: 'FAILED',
      reason: { code: 'NOT_ENOUGH_FUNDS', message: 'Payer has insufficient funds' },
    })

    const reason = transaction.getReason()

    expect(reason).not.toBeNull()
    expect(reason!.isNotEnoughFunds()).toBe(true)
    expect(reason!.getMessage()).toBe('Payer has insufficient funds')
  })

  it('returns null when the transaction carries no reason', () => {
    const transaction = Transaction.parse({
      externalId: 'ext-ref-001',
      amount: '100',
      currency: 'EUR',
      status: 'SUCCESSFUL',
    })

    expect(transaction.getReason()).toBeNull()
  })

  it('returns null when reason is not an object', () => {
    const transaction = Transaction.parse({
      externalId: 'ext-ref-001',
      status: 'FAILED',
      reason: 'NOT_ENOUGH_FUNDS',
    })

    expect(transaction.getReason()).toBeNull()
  })
})
