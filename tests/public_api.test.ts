import { describe, it, expect } from 'vitest'
import * as api from '../src/index.js'

describe('public API surface', () => {
  it('exports everything the PHP client exposes', () => {
    const expected = [
      'MomoApi',
      'MTN_ENVIRONMENTS',
      'SANDBOX_URL',
      'PRODUCTION_URL',
      'AbstractApiProduct',
      'CollectionApi',
      'DisbursementApi',
      'SandboxApi',
      'Config',
      'DEFAULT_CURRENCY',
      'ApiToken',
      'AccountBalance',
      'Transaction',
      'ErrorReason',
      'AbstractRequest',
      'PaymentRequest',
      'TransferRequest',
      'RefundRequest',
      'MomoException',
      'BadRequestException',
      'BadResourceException',
      'InvalidSubscriptionKeyException',
      'ResourceNotFoundException',
      'ConflictException',
      'InternalServerErrorException',
      'createException',
      'generateUUID',
      'TokenCache',
      'AirtelApi',
      'AbstractAirtelApi',
      'AirtelCollectionApi',
      'AirtelDisbursementApi',
      'AirtelConfig',
      'AirtelTransaction',
      'AirtelResponseStatus',
      'encryptAirtelPin',
      'cleanPhoneNumber',
      'AIRTEL_COUNTRY_CODES',
    ]

    for (const name of expected) {
      expect(api, `missing export: ${name}`).toHaveProperty(name)
    }
  })

  it('exposes all 12 environments', () => {
    expect(api.MTN_ENVIRONMENTS).toHaveLength(12)
    expect(api.MTN_ENVIRONMENTS).toContain(api.ENVIRONMENT_SANDBOX)
    expect(api.MTN_ENVIRONMENTS).toContain(api.ENVIRONMENT_MTN_CONGO)
  })
})
