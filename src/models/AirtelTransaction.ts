/**
 * Airtel Money transaction status codes:
 * - `TS`  — Transaction Successful
 * - `TF`  — Transaction Failed
 * - `TIP` — Transaction In Progress (pending)
 */
export type AirtelTransactionStatus = 'TS' | 'TF' | 'TIP' | string

export class AirtelTransaction {
  private readonly id: string
  private readonly status: AirtelTransactionStatus
  private readonly airtelMoneyId: string | null
  private readonly message: string | null
  private readonly requestId: string | null

  private constructor(data: {
    id: string
    status: AirtelTransactionStatus
    airtel_money_id?: string
    message?: string
    request_id?: string
  }) {
    this.id = data.id
    this.status = data.status
    this.airtelMoneyId = data.airtel_money_id ?? null
    this.message = data.message ?? null
    this.requestId = data.request_id ?? null
  }

  static parse(data: Record<string, unknown>): AirtelTransaction {
    return new AirtelTransaction({
      id: String(data['id'] ?? ''),
      status: String(data['status'] ?? ''),
      airtel_money_id:
        data['airtel_money_id'] != null ? String(data['airtel_money_id']) : undefined,
      message: data['message'] != null ? String(data['message']) : undefined,
      request_id: data['request_id'] != null ? String(data['request_id']) : undefined,
    })
  }

  getStatus(): AirtelTransactionStatus {
    return this.status
  }

  isSuccessful(): boolean {
    return this.status === 'TS'
  }

  isPending(): boolean {
    return this.status === 'TIP'
  }

  isFailed(): boolean {
    return this.status === 'TF'
  }

  getId(): string {
    return this.id
  }

  getAirtelMoneyId(): string | null {
    return this.airtelMoneyId
  }

  getMessage(): string | null {
    return this.message
  }
}
