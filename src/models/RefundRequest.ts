import { AbstractRequest } from './AbstractRequest.js'
import { DEFAULT_CURRENCY } from './currency.js'

export class RefundRequest extends AbstractRequest {
  /** Reference id of the collection payment being refunded. */
  readonly referenceIdToRefund: string

  constructor(
    amount: string,
    currency: string,
    externalId: string,
    referenceIdToRefund: string,
    payerMessage: string = '',
    payeeNote: string = ''
  ) {
    super(amount, currency, externalId, payerMessage, payeeNote)
    this.referenceIdToRefund = referenceIdToRefund
  }

  static make(
    amount: string,
    referenceIdToRefund: string,
    externalId: string,
    currency: string = DEFAULT_CURRENCY,
    payerMessage: string = '',
    payeeNote: string = ''
  ): RefundRequest {
    return new RefundRequest(
      amount,
      currency,
      externalId,
      referenceIdToRefund,
      payerMessage,
      payeeNote
    )
  }

  protected subject(): Record<string, unknown> {
    return { referenceIdToRefund: this.referenceIdToRefund }
  }
}
