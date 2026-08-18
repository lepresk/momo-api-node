import { AbstractRequest, msisdn } from './AbstractRequest.js'
import { DEFAULT_CURRENCY } from './currency.js'

export class PaymentRequest extends AbstractRequest {
  /** MSISDN of the party being asked to pay. */
  readonly payer: string

  constructor(
    amount: string,
    currency: string,
    externalId: string,
    payer: string,
    payerMessage: string = '',
    payeeNote: string = ''
  ) {
    super(amount, currency, externalId, payerMessage, payeeNote)
    this.payer = payer
  }

  static make(
    amount: string,
    payer: string,
    externalId: string,
    currency: string = DEFAULT_CURRENCY,
    payerMessage: string = '',
    payeeNote: string = ''
  ): PaymentRequest {
    return new PaymentRequest(amount, currency, externalId, payer, payerMessage, payeeNote)
  }

  protected subject(): Record<string, unknown> {
    return { payer: msisdn(this.payer) }
  }
}
