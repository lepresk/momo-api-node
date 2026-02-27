export class TransferRequest {
  readonly amount: string
  readonly currency: string
  readonly externalId: string
  readonly payee: string
  readonly payerMessage: string
  readonly payeeNote: string

  constructor(
    amount: string,
    currency: string,
    externalId: string,
    payee: string,
    payerMessage: string = '',
    payeeNote: string = ''
  ) {
    this.amount = amount
    this.currency = currency
    this.externalId = externalId
    this.payee = payee
    this.payerMessage = payerMessage
    this.payeeNote = payeeNote
  }

  static make(
    amount: string,
    payee: string,
    externalId: string,
    currency: string = 'EUR',
    payerMessage: string = '',
    payeeNote: string = ''
  ): TransferRequest {
    return new TransferRequest(amount, currency, externalId, payee, payerMessage, payeeNote)
  }

  toBody(): object {
    return {
      amount: this.amount,
      currency: this.currency,
      externalId: this.externalId,
      payee: {
        partyIdType: 'MSISDN',
        partyId: this.payee,
      },
      payerMessage: this.payerMessage,
      payeeNote: this.payeeNote,
    }
  }
}
