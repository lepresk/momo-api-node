import { isRecord, optionalString } from '../support/json.js'

/**
 * The `status` envelope Airtel returns alongside `data`. Airtel reports
 * business failures — insufficient funds, invalid PIN, unknown transaction —
 * with HTTP 200 and `success: false` here, so it has to be inspected rather
 * than relying on the status code alone.
 */
export class AirtelResponseStatus {
  private readonly success: boolean
  private readonly message: string | null
  private readonly code: string | null
  private readonly resultCode: string | null
  private readonly responseCode: string | null

  private constructor(data: {
    success: boolean
    message: string | null
    code: string | null
    resultCode: string | null
    responseCode: string | null
  }) {
    this.success = data.success
    this.message = data.message
    this.code = data.code
    this.resultCode = data.resultCode
    this.responseCode = data.responseCode
  }

  /** Returns null when the payload carries no `status` envelope. */
  static parse(body: unknown): AirtelResponseStatus | null {
    if (!isRecord(body) || !isRecord(body['status'])) {
      return null
    }
    const status = body['status']

    return new AirtelResponseStatus({
      success: status['success'] !== false,
      message: optionalString(status, 'message') ?? null,
      code: optionalString(status, 'code') ?? null,
      resultCode: optionalString(status, 'result_code') ?? null,
      responseCode: optionalString(status, 'response_code') ?? null,
    })
  }

  isSuccessful(): boolean {
    return this.success
  }

  getMessage(): string | null {
    return this.message
  }

  /** Airtel's HTTP-ish `code`, e.g. `"500"`. */
  getCode(): string | null {
    return this.code
  }

  /** Airtel's machine-readable outcome, e.g. `"ESB000008"`. */
  getResultCode(): string | null {
    return this.resultCode
  }

  /** Airtel's long-form response code, e.g. `"DP00800001006"`. */
  getResponseCode(): string | null {
    return this.responseCode
  }
}
