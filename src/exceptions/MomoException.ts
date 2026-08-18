import { ErrorReason } from '../models/ErrorReason.js'
import { isRecord, optionalString } from '../support/json.js'

export class MomoException extends Error {
  /** HTTP status code returned by the API. */
  readonly statusCode: number
  /** The failure reason from the API payload, when present. */
  readonly reason: ErrorReason | null
  /** Raw response body, kept for debugging. */
  readonly body: string | null

  constructor(
    message: string,
    statusCode: number,
    reason: ErrorReason | null = null,
    body: string | null = null
  ) {
    super(message)
    this.name = 'MomoException'
    this.statusCode = statusCode
    this.reason = reason
    this.body = body
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /** Machine-readable error code from the API payload, when present. */
  get code(): string | null {
    return this.reason?.getCode() || null
  }
}

export class BadRequestException extends MomoException {
  constructor(
    message: string = 'Bad request, e.g. invalid data was sent in the request.',
    reason: ErrorReason | null = null,
    body: string | null = null
  ) {
    super(message, 400, reason, body)
    this.name = 'BadRequestException'
  }
}

export class BadResourceException extends MomoException {
  constructor(
    message: string = 'Bad request, e.g. an incorrectly formatted reference id was provided.',
    reason: ErrorReason | null = null,
    body: string | null = null
  ) {
    super(message, 400, reason, body)
    this.name = 'BadResourceException'
  }
}

export class InvalidSubscriptionKeyException extends MomoException {
  constructor(
    message: string = 'Invalid subscription key',
    reason: ErrorReason | null = null,
    body: string | null = null
  ) {
    super(message, 401, reason, body)
    this.name = 'InvalidSubscriptionKeyException'
  }
}

export class ResourceNotFoundException extends MomoException {
  constructor(
    message: string = 'Not found, reference id not found or closed in sandbox',
    reason: ErrorReason | null = null,
    body: string | null = null
  ) {
    super(message, 404, reason, body)
    this.name = 'ResourceNotFoundException'
  }
}

export class ConflictException extends MomoException {
  constructor(
    message: string = 'Conflict, duplicated reference id',
    reason: ErrorReason | null = null,
    body: string | null = null
  ) {
    super(message, 409, reason, body)
    this.name = 'ConflictException'
  }
}

export class InternalServerErrorException extends MomoException {
  constructor(
    message: string = 'Internal server error',
    reason: ErrorReason | null = null,
    body: string | null = null
  ) {
    super(message, 500, reason, body)
    this.name = 'InternalServerErrorException'
  }
}

/**
 * MTN and Airtel report failures as a JSON body such as
 * `{"code":"NOT_ENOUGH_FUNDS","message":"..."}`. Parsing it here lets the thrown
 * error carry a readable message and the same typed {@link ErrorReason} vocabulary
 * a failed `Transaction` exposes.
 */
function parseErrorBody(body?: string): { message?: string; reason: ErrorReason | null } {
  let parsed: unknown
  try {
    parsed = JSON.parse(body ?? '')
  } catch {
    return { reason: null }
  }
  if (!isRecord(parsed)) {
    return { reason: null }
  }

  return {
    message: optionalString(parsed, 'message'),
    reason: ErrorReason.fromObject(parsed),
  }
}

const BY_STATUS: Record<number, new (m?: string, r?: ErrorReason | null, b?: string | null) => MomoException> = {
  400: BadRequestException,
  401: InvalidSubscriptionKeyException,
  404: ResourceNotFoundException,
  409: ConflictException,
  500: InternalServerErrorException,
}

export function createException(status: number, body?: string): MomoException {
  const { message, reason } = parseErrorBody(body)
  const raw = body ?? null
  const Exception = BY_STATUS[status]

  return Exception
    ? new Exception(message, reason, raw)
    : new MomoException(
        message ?? `Operation failed with status ${status}`,
        status,
        reason,
        raw
      )
}
