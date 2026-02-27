export type TransactionStatus = 'SUCCESSFUL' | 'PENDING' | 'FAILED'

export class Transaction {
  private readonly data: Record<string, unknown>

  private constructor(data: Record<string, unknown>) {
    this.data = data
  }

  static parse(data: Record<string, unknown>): Transaction {
    return new Transaction(data)
  }

  getStatus(): TransactionStatus {
    return this.data['status'] as TransactionStatus
  }

  isSuccessful(): boolean {
    return this.getStatus() === 'SUCCESSFUL'
  }

  isPending(): boolean {
    return this.getStatus() === 'PENDING'
  }

  isFailed(): boolean {
    return this.getStatus() === 'FAILED'
  }

  getAmount(): string {
    return this.data['amount'] as string
  }

  getCurrency(): string {
    return this.data['currency'] as string
  }

  getPayer(): string | null {
    const payer = this.data['payer'] as Record<string, unknown> | undefined
    return (payer?.['partyId'] as string) ?? null
  }

  getPayee(): string | null {
    const payee = this.data['payee'] as Record<string, unknown> | undefined
    return (payee?.['partyId'] as string) ?? null
  }

  getFinancialTransactionId(): string | null {
    return (this.data['financialTransactionId'] as string) ?? null
  }

  getExternalId(): string | null {
    return (this.data['externalId'] as string) ?? null
  }

  getPayerMessage(): string | null {
    return (this.data['payerMessage'] as string) ?? null
  }

  getPayeeNote(): string | null {
    return (this.data['payeeNote'] as string) ?? null
  }
}
