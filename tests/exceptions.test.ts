import { describe, it, expect } from 'vitest'
import {
  MomoException,
  BadRequestException,
  BadResourceException,
  InvalidSubscriptionKeyException,
  ResourceNotFoundException,
  ConflictException,
  InternalServerErrorException,
  createException,
} from '../src/exceptions/MomoException.js'
import { ErrorReason } from '../src/models/ErrorReason.js'

describe('createException', () => {
  it('extracts the message field from a JSON error body', () => {
    const error = createException(
      400,
      JSON.stringify({ code: 'INVALID_CURRENCY', message: 'Currency not supported' })
    )

    expect(error).toBeInstanceOf(BadRequestException)
    expect(error.message).toBe('Currency not supported')
  })

  it('exposes the failure as a typed ErrorReason', () => {
    const error = createException(
      409,
      JSON.stringify({ code: 'RESOURCE_ALREADY_EXIST', message: 'Duplicated reference id' })
    )

    expect(error.reason).toBeInstanceOf(ErrorReason)
    expect(error.reason!.is(ErrorReason.RESOURCE_ALREADY_EXIST)).toBe(true)
    expect(error.reason!.getMessage()).toBe('Duplicated reference id')
  })

  it('reports the same vocabulary as Transaction.getReason', () => {
    const error = createException(400, JSON.stringify({ code: 'NOT_ENOUGH_FUNDS' }))

    expect(error.reason?.isNotEnoughFunds()).toBe(true)
  })

  it('has no reason when the body is not a JSON object', () => {
    expect(createException(500, 'gateway down').reason).toBeNull()
    expect(createException(500, '').reason).toBeNull()
  })

  it('exposes the error code from a JSON error body', () => {
    const error = createException(
      409,
      JSON.stringify({ code: 'RESOURCE_ALREADY_EXIST', message: 'Duplicated reference id' })
    )

    expect(error).toBeInstanceOf(ConflictException)
    expect(error.code).toBe('RESOURCE_ALREADY_EXIST')
    expect(error.message).toBe('Duplicated reference id')
  })

  it('keeps the raw body available for debugging', () => {
    const body = JSON.stringify({ code: 'NOT_ALLOWED', message: 'Not allowed' })
    const error = createException(400, body)

    expect(error.body).toBe(body)
  })

  it('falls back to the default message when the JSON body has no message', () => {
    const error = createException(401, JSON.stringify({ code: 'NOT_ALLOWED' }))

    expect(error).toBeInstanceOf(InvalidSubscriptionKeyException)
    expect(error.message).toBe('Invalid subscription key')
    expect(error.code).toBe('NOT_ALLOWED')
  })

  it('falls back to the default message when the body is empty', () => {
    const error = createException(404, '')

    expect(error).toBeInstanceOf(ResourceNotFoundException)
    expect(error.message).toBe('Not found, reference id not found or closed in sandbox')
    expect(error.code).toBeNull()
  })

  it('falls back to the default message when the body is not JSON', () => {
    const error = createException(500, '<html>Gateway error</html>')

    expect(error).toBeInstanceOf(InternalServerErrorException)
    expect(error.message).toBe('Internal server error')
    expect(error.body).toBe('<html>Gateway error</html>')
  })

  it('maps an unmapped status to a plain MomoException', () => {
    const error = createException(503, JSON.stringify({ message: 'Service unavailable' }))

    expect(error.constructor).toBe(MomoException)
    expect(error.statusCode).toBe(503)
    expect(error.message).toBe('Service unavailable')
  })

  it('describes the failure when an unmapped status has no message', () => {
    const error = createException(418, '')

    expect(error.message).toBe('Operation failed with status 418')
    expect(error.statusCode).toBe(418)
  })
})

describe('exception hierarchy', () => {
  it('exposes BadResourceException for malformed reference ids', () => {
    const error = new BadResourceException()

    expect(error).toBeInstanceOf(MomoException)
    expect(error.statusCode).toBe(400)
    expect(error.message).toBe(
      'Bad request, e.g. an incorrectly formatted reference id was provided.'
    )
  })

  it('keeps every typed exception catchable as MomoException', () => {
    const errors = [
      new BadRequestException(),
      new BadResourceException(),
      new InvalidSubscriptionKeyException(),
      new ResourceNotFoundException(),
      new ConflictException(),
      new InternalServerErrorException(),
    ]

    for (const error of errors) {
      expect(error).toBeInstanceOf(MomoException)
      expect(error).toBeInstanceOf(Error)
    }
  })
})
