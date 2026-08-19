import { optionalString } from '../support/json.js'

/**
 * Airtel Money transaction status codes:
 * - `TS`  — Transaction Successful
 * - `TF`  — Transaction Failed
 * - `TIP` — Transaction In Progress
 * - `TI`  — Transaction Initiated (also pending)
 */
export type AirtelTransactionStatus =
  | 'TS'
  | 'TF'
  | 'TIP'
  | 'TI'
  // Airtel may return a code we do not know yet; `string & {}` keeps the four
  // above in autocomplete instead of collapsing the whole union to `string`.
  | (string & {})

export class AirtelTransaction {
  static readonly STATUS_SUCCESSFUL = 'TS'
  static readonly STATUS_FAILED = 'TF'
  static readonly STATUS_PENDING = 'TIP'
  static readonly STATUS_IN_PROGRESS = 'TI'

  private readonly id: string
  private readonly status: AirtelTransactionStatus
  private readonly referenceId: string | null
  private readonly airtelMoneyId: string | null
  private readonly message: string | null

  private constructor(data: {
    id: string
    status: AirtelTransactionStatus
    reference_id?: string
    airtel_money_id?: string
    message?: string
  }) {
    this.id = data.id
    this.status = data.status
    this.referenceId = data.reference_id ?? null
    this.airtelMoneyId = data.airtel_money_id ?? null
    this.message = data.message ?? null
  }

  static parse(data: Record<string, unknown>): AirtelTransaction {
    return new AirtelTransaction({
      id: optionalString(data, 'id') ?? '',
      status: optionalString(data, 'status') ?? '',
      reference_id: optionalString(data, 'reference_id'),
      airtel_money_id: optionalString(data, 'airtel_money_id'),
      message: optionalString(data, 'message'),
    })
  }

  getStatus(): AirtelTransactionStatus {
    return this.status
  }

  isSuccessful(): boolean {
    return this.status === AirtelTransaction.STATUS_SUCCESSFUL
  }

  /** Airtel uses two codes for "not settled yet". */
  isPending(): boolean {
    return (
      this.status === AirtelTransaction.STATUS_PENDING ||
      this.status === AirtelTransaction.STATUS_IN_PROGRESS
    )
  }

  isFailed(): boolean {
    return this.status === AirtelTransaction.STATUS_FAILED
  }

  getId(): string {
    return this.id
  }

  /** Airtel's own reference for the transaction, when it returns one. */
  getReferenceId(): string | null {
    return this.referenceId
  }

  getAirtelMoneyId(): string | null {
    return this.airtelMoneyId
  }

  getMessage(): string | null {
    return this.message
  }
}
