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
      ['LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED', 'isLowBalanceOrPayeeLimitReachedOrNotAllowed'],
      ['COULD_NOT_PERFORM_TRANSACTION', 'isCouldNotPerformTransaction'],
      ['SENDER_ACCOUNT_NOT_ACTIVE', 'isSenderAccountNotActive'],
      ['PAYEE_LIMIT_REACHED', 'isPayeeLimitReached'],
      ['TRANSACTION_NOT_FOUND', 'isTransactionNotFound'],
      ['VALIDATION_ERROR', 'isValidationError'],
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

  it('renders as [CODE] alone when there is no message', () => {
    expect(String(new ErrorReason('NOT_ENOUGH_FUNDS', ''))).toBe('[NOT_ENOUGH_FUNDS]')
  })

  it('groups the payer funding failures, including the Congo code', () => {
    const matches = (code: string) => new ErrorReason(code, '').isPayerFundingFailure()

    expect(matches(ErrorReason.NOT_ENOUGH_FUNDS)).toBe(true)
    expect(matches(ErrorReason.PAYER_LIMIT_REACHED)).toBe(true)
    expect(matches(ErrorReason.LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED)).toBe(true)

    expect(matches(ErrorReason.PAYER_NOT_FOUND)).toBe(false)
    expect(matches(ErrorReason.PAYEE_LIMIT_REACHED)).toBe(false)
    expect(matches(ErrorReason.EXPIRED)).toBe(false)
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
    expect(ErrorReason.LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED).toBe(
      'LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED'
    )
    expect(ErrorReason.COULD_NOT_PERFORM_TRANSACTION).toBe('COULD_NOT_PERFORM_TRANSACTION')
    expect(ErrorReason.SENDER_ACCOUNT_NOT_ACTIVE).toBe('SENDER_ACCOUNT_NOT_ACTIVE')
    expect(ErrorReason.PAYEE_LIMIT_REACHED).toBe('PAYEE_LIMIT_REACHED')
    expect(ErrorReason.TRANSACTION_NOT_FOUND).toBe('TRANSACTION_NOT_FOUND')
    expect(ErrorReason.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
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

  it('parses the bare string reason Get Status returns for a FAILED transaction', () => {
    // MTN's documented Get Status body: HTTP 200, reason as a string
    const transaction = Transaction.parse({
      externalId: 'ext-ref-001',
      amount: '5000',
      currency: 'XAF',
      status: 'FAILED',
      reason: 'NOT_ENOUGH_FUNDS',
    })

    const reason = transaction.getReason()

    expect(reason).not.toBeNull()
    expect(reason!.getCode()).toBe('NOT_ENOUGH_FUNDS')
    expect(reason!.getMessage()).toBe('')
    expect(reason!.isNotEnoughFunds()).toBe(true)
  })

  it('parses the code MTN Congo returns for a payer who cannot pay', () => {
    const transaction = Transaction.parse({
      amount: '2500',
      currency: 'XAF',
      status: 'FAILED',
      reason: 'LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED',
    })

    const reason = transaction.getReason()

    expect(reason!.isLowBalanceOrPayeeLimitReachedOrNotAllowed()).toBe(true)
    expect(reason!.isPayerFundingFailure()).toBe(true)
    expect(reason!.isNotEnoughFunds()).toBe(false)
  })

  it('returns null when reason is an empty string or another type', () => {
    for (const reason of ['', 42, true, ['NOT_ENOUGH_FUNDS']]) {
      const transaction = Transaction.parse({ status: 'FAILED', reason })

      expect(transaction.getReason(), JSON.stringify(reason)).toBeNull()
    }
  })
})
