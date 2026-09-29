import { optionalString } from '../support/json.js'

/**
 * The `{ code, message }` pair an API returns to explain a failure. Get Status
 * sends a bare string code instead; it becomes an `ErrorReason` with an empty
 * message.
 *
 * The constants and predicates below are MTN's vocabulary. An Airtel failure is
 * carried by the same type — `getCode()` and `getMessage()` are meaningful — but
 * its codes (`ESB000008`, ...) match none of the predicates, so match on
 * `getCode()` rather than `isNotEnoughFunds()` when handling Airtel errors.
 */
export class ErrorReason {
  static readonly PAYEE_NOT_FOUND = 'PAYEE_NOT_FOUND'
  static readonly PAYER_NOT_FOUND = 'PAYER_NOT_FOUND'
  static readonly NOT_ALLOWED = 'NOT_ALLOWED'
  static readonly NOT_ALLOWED_TARGET_ENVIRONMENT = 'NOT_ALLOWED_TARGET_ENVIRONMENT'
  static readonly INVALID_CALLBACK_URL_HOST = 'INVALID_CALLBACK_URL_HOST'
  static readonly INVALID_CURRENCY = 'INVALID_CURRENCY'
  static readonly SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
  static readonly INTERNAL_PROCESSING_ERROR = 'INTERNAL_PROCESSING_ERROR'
  static readonly NOT_ENOUGH_FUNDS = 'NOT_ENOUGH_FUNDS'
  static readonly PAYER_LIMIT_REACHED = 'PAYER_LIMIT_REACHED'
  static readonly PAYEE_NOT_ALLOWED_TO_RECEIVE = 'PAYEE_NOT_ALLOWED_TO_RECEIVE'
  static readonly PAYMENT_NOT_APPROVED = 'PAYMENT_NOT_APPROVED'
  static readonly RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND'
  static readonly APPROVAL_REJECTED = 'APPROVAL_REJECTED'
  static readonly EXPIRED = 'EXPIRED'
  static readonly TRANSACTION_CANCELED = 'TRANSACTION_CANCELED'
  static readonly RESOURCE_ALREADY_EXIST = 'RESOURCE_ALREADY_EXIST'
  static readonly COULD_NOT_PERFORM_TRANSACTION = 'COULD_NOT_PERFORM_TRANSACTION'
  static readonly SENDER_ACCOUNT_NOT_ACTIVE = 'SENDER_ACCOUNT_NOT_ACTIVE'
  static readonly PAYEE_LIMIT_REACHED = 'PAYEE_LIMIT_REACHED'
  static readonly TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND'
  static readonly VALIDATION_ERROR = 'VALIDATION_ERROR'
  /** MTN Congo's Get Status code for a payer with no balance, at a limit, or not allowed to pay. */
  static readonly LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED =
    'LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED'

  private readonly code: string
  private readonly message: string

  constructor(code: string, message: string) {
    this.code = code
    this.message = message
  }

  static fromObject(data: Record<string, unknown>): ErrorReason {
    return new ErrorReason(
      optionalString(data, 'code') ?? '',
      optionalString(data, 'message') ?? ''
    )
  }

  getCode(): string {
    return this.code
  }

  getMessage(): string {
    return this.message
  }

  is(code: string): boolean {
    return this.code === code
  }

  isPayeeNotFound(): boolean {
    return this.is(ErrorReason.PAYEE_NOT_FOUND)
  }

  isPayerNotFound(): boolean {
    return this.is(ErrorReason.PAYER_NOT_FOUND)
  }

  isNotAllowed(): boolean {
    return this.is(ErrorReason.NOT_ALLOWED)
  }

  isNotAllowedTargetEnvironment(): boolean {
    return this.is(ErrorReason.NOT_ALLOWED_TARGET_ENVIRONMENT)
  }

  isInvalidCallbackUrlHost(): boolean {
    return this.is(ErrorReason.INVALID_CALLBACK_URL_HOST)
  }

  isInvalidCurrency(): boolean {
    return this.is(ErrorReason.INVALID_CURRENCY)
  }

  isServiceUnavailable(): boolean {
    return this.is(ErrorReason.SERVICE_UNAVAILABLE)
  }

  isInternalProcessingError(): boolean {
    return this.is(ErrorReason.INTERNAL_PROCESSING_ERROR)
  }

  isNotEnoughFunds(): boolean {
    return this.is(ErrorReason.NOT_ENOUGH_FUNDS)
  }

  isPayerLimitReached(): boolean {
    return this.is(ErrorReason.PAYER_LIMIT_REACHED)
  }

  isPayeeNotAllowedToReceive(): boolean {
    return this.is(ErrorReason.PAYEE_NOT_ALLOWED_TO_RECEIVE)
  }

  isPaymentNotApproved(): boolean {
    return this.is(ErrorReason.PAYMENT_NOT_APPROVED)
  }

  isResourceNotFound(): boolean {
    return this.is(ErrorReason.RESOURCE_NOT_FOUND)
  }

  isApprovalRejected(): boolean {
    return this.is(ErrorReason.APPROVAL_REJECTED)
  }

  isExpired(): boolean {
    return this.is(ErrorReason.EXPIRED)
  }

  isTransactionCanceled(): boolean {
    return this.is(ErrorReason.TRANSACTION_CANCELED)
  }

  isResourceAlreadyExist(): boolean {
    return this.is(ErrorReason.RESOURCE_ALREADY_EXIST)
  }

  isLowBalanceOrPayeeLimitReachedOrNotAllowed(): boolean {
    return this.is(ErrorReason.LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED)
  }

  isCouldNotPerformTransaction(): boolean {
    return this.is(ErrorReason.COULD_NOT_PERFORM_TRANSACTION)
  }

  isSenderAccountNotActive(): boolean {
    return this.is(ErrorReason.SENDER_ACCOUNT_NOT_ACTIVE)
  }

  isPayeeLimitReached(): boolean {
    return this.is(ErrorReason.PAYEE_LIMIT_REACHED)
  }

  isTransactionNotFound(): boolean {
    return this.is(ErrorReason.TRANSACTION_NOT_FOUND)
  }

  isValidationError(): boolean {
    return this.is(ErrorReason.VALIDATION_ERROR)
  }

  /**
   * The payer could not fund the payment: not enough balance or a limit reached.
   * MTN Congo reports this as `LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED`
   * rather than `NOT_ENOUGH_FUNDS`, so check this rather than `isNotEnoughFunds()`
   * when the market does not matter.
   */
  isPayerFundingFailure(): boolean {
    return (
      this.isNotEnoughFunds() ||
      this.isPayerLimitReached() ||
      this.isLowBalanceOrPayeeLimitReachedOrNotAllowed()
    )
  }

  toString(): string {
    return this.message === '' ? `[${this.code}]` : `[${this.code}] ${this.message}`
  }
}
