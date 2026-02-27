export class PaymentRequest {
  readonly amount: string
  readonly currency: string
  readonly externalId: string
  readonly payer: string
  readonly payerMessage: string
  readonly payeeNote: string

  constructor(
    amount: string,
    currency: string,
    externalId: string,
    payer: string,
    payerMessage: string = '',
    payeeNote: string = ''
  ) {
    this.amount = amount
    this.currency = currency
    this.externalId = externalId
    this.payer = payer
    this.payerMessage = payerMessage
    this.payeeNote = payeeNote
  }

  static make(
    amount: string,
    payer: string,
    externalId: string,
    currency: string = 'EUR',
    payerMessage: string = '',
    payeeNote: string = ''
  ): PaymentRequest {
    return new PaymentRequest(amount, currency, externalId, payer, payerMessage, payeeNote)
  }

  toBody(): object {
    return {
      amount: this.amount,
      currency: this.currency,
      externalId: this.externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: this.payer,
      },
      payerMessage: this.payerMessage,
      payeeNote: this.payeeNote,
    }
  }
}
