export class RefundRequest {
  readonly amount: string
  readonly currency: string
  readonly externalId: string
  readonly referenceIdToRefund: string
  readonly payerMessage: string
  readonly payeeNote: string

  constructor(
    amount: string,
    currency: string,
    externalId: string,
    referenceIdToRefund: string,
    payerMessage: string = '',
    payeeNote: string = ''
  ) {
    this.amount = amount
    this.currency = currency
    this.externalId = externalId
    this.referenceIdToRefund = referenceIdToRefund
    this.payerMessage = payerMessage
    this.payeeNote = payeeNote
  }

  static make(
    amount: string,
    referenceIdToRefund: string,
    externalId: string,
    currency: string = 'EUR',
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

  toBody(): object {
    return {
      amount: this.amount,
      currency: this.currency,
      externalId: this.externalId,
      referenceIdToRefund: this.referenceIdToRefund,
      payerMessage: this.payerMessage,
      payeeNote: this.payeeNote,
    }
  }
}
