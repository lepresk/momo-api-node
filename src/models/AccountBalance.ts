export class AccountBalance {
  private readonly availableBalance: string
  private readonly currency: string

  private constructor(availableBalance: string, currency: string) {
    this.availableBalance = availableBalance
    this.currency = currency
  }

  static parse(data: Record<string, unknown>): AccountBalance {
    return new AccountBalance(
      data['availableBalance'] as string,
      data['currency'] as string
    )
  }

  getAvailableBalance(): string {
    return this.availableBalance
  }

  getCurrency(): string {
    return this.currency
  }
}
