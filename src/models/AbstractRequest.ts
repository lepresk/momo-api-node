import { DEFAULT_CURRENCY } from './currency.js'

/** The `{ partyIdType, partyId }` shape MTN uses for a payer or payee. */
export function msisdn(phone: string): { partyIdType: string; partyId: string } {
  return { partyIdType: 'MSISDN', partyId: phone }
}

/**
 * Fields shared by every MTN write request. Subclasses add the one field that
 * distinguishes them — the payer, the payee, or the payment being refunded.
 */
export abstract class AbstractRequest {
  readonly amount: string
  readonly currency: string
  readonly externalId: string
  readonly payerMessage: string
  readonly payeeNote: string

  constructor(
    amount: string,
    currency: string = DEFAULT_CURRENCY,
    externalId: string,
    payerMessage: string = '',
    payeeNote: string = ''
  ) {
    this.amount = amount
    this.currency = currency
    this.externalId = externalId
    this.payerMessage = payerMessage
    this.payeeNote = payeeNote
  }

  /** The field this request type adds to the common body. */
  protected abstract subject(): Record<string, unknown>

  toBody(): object {
    return {
      amount: this.amount,
      currency: this.currency,
      externalId: this.externalId,
      ...this.subject(),
      payerMessage: this.payerMessage,
      payeeNote: this.payeeNote,
    }
  }
}
