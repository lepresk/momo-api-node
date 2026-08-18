import { AbstractRequest, msisdn } from './AbstractRequest.js'
import { DEFAULT_CURRENCY } from './currency.js'

export class TransferRequest extends AbstractRequest {
  /** MSISDN of the party receiving the funds. */
  readonly payee: string

  constructor(
    amount: string,
    currency: string,
    externalId: string,
    payee: string,
    payerMessage: string = '',
    payeeNote: string = ''
  ) {
    super(amount, currency, externalId, payerMessage, payeeNote)
    this.payee = payee
  }

  static make(
    amount: string,
    payee: string,
    externalId: string,
    currency: string = DEFAULT_CURRENCY,
    payerMessage: string = '',
    payeeNote: string = ''
  ): TransferRequest {
    return new TransferRequest(amount, currency, externalId, payee, payerMessage, payeeNote)
  }

  protected subject(): Record<string, unknown> {
    return { payee: msisdn(this.payee) }
  }
}
