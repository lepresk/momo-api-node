import { describe, it, expect } from 'vitest'
import {
  MomoApi,
  MTN_ENVIRONMENTS,
  ENVIRONMENT_SANDBOX,
  ENVIRONMENT_MTN_CONGO,
  ENVIRONMENT_MTN_GHANA,
  SANDBOX_URL,
  PRODUCTION_URL,
} from '../src/MomoApi.js'
import { Config } from '../src/models/Config.js'
import { CollectionApi } from '../src/products/CollectionApi.js'
import { DisbursementApi } from '../src/products/DisbursementApi.js'

const credentials = {
  subscriptionKey: 'test-subscription-key',
  apiUser: 'test-api-user',
  apiKey: 'test-api-key',
}

describe('MomoApi.getBaseUrl', () => {
  it('resolves the sandbox environment to the sandbox host', () => {
    expect(MomoApi.getBaseUrl(ENVIRONMENT_SANDBOX)).toBe(SANDBOX_URL)
  })

  it('resolves every production market to the production host', () => {
    for (const environment of MTN_ENVIRONMENTS) {
      if (environment === ENVIRONMENT_SANDBOX) continue
      expect(MomoApi.getBaseUrl(environment)).toBe(PRODUCTION_URL)
    }
  })

  it('rejects an unknown environment instead of silently hitting production', () => {
    expect(() => MomoApi.getBaseUrl('mtnatlantis')).toThrow(
      "Unknown environment: 'mtnatlantis'"
    )
  })
})

describe('MomoApi.collection', () => {
  it('honours the requested production environment', () => {
    const collection = MomoApi.collection({
      environment: ENVIRONMENT_MTN_GHANA,
      ...credentials,
    })

    expect(collection).toBeInstanceOf(CollectionApi)
    expect(collection.getBaseUrl()).toBe(PRODUCTION_URL)
    expect(collection.getEnvironment()).toBe(ENVIRONMENT_MTN_GHANA)
  })

  it('defaults to sandbox when no environment is given', () => {
    const collection = MomoApi.collection(credentials)

    expect(collection.getBaseUrl()).toBe(SANDBOX_URL)
    expect(collection.getEnvironment()).toBe(ENVIRONMENT_SANDBOX)
  })

  it('carries the callback url into the config', () => {
    const collection = MomoApi.collection({
      ...credentials,
      callbackUrl: 'https://example.com/hook',
    })

    expect(collection.getSubscriptionKey()).toBe('test-subscription-key')
    expect(collection.getConfig().callbackUri).toBe('https://example.com/hook')
  })

  it('defaults the callback url to an empty string', () => {
    const collection = MomoApi.collection(credentials)

    expect(collection.getConfig().callbackUri).toBe('')
  })

  it('rejects a missing subscription key', () => {
    expect(() =>
      MomoApi.collection({ ...credentials, subscriptionKey: '' })
    ).toThrow('subscriptionKey is required')
  })

  it('rejects a missing api user', () => {
    expect(() => MomoApi.collection({ ...credentials, apiUser: '' })).toThrow(
      'apiUser is required'
    )
  })

  it('rejects a missing api key', () => {
    expect(() => MomoApi.collection({ ...credentials, apiKey: '' })).toThrow(
      'apiKey is required'
    )
  })

  it('rejects an unknown environment', () => {
    expect(() =>
      MomoApi.collection({ ...credentials, environment: 'mtnatlantis' })
    ).toThrow("Unknown environment: 'mtnatlantis'")
  })

  it('still accepts a Config instance, defaulting to sandbox', () => {
    const config = Config.collection('sub', 'user', 'key', '')
    const collection = MomoApi.collection(config)

    expect(collection.getBaseUrl()).toBe(SANDBOX_URL)
    expect(collection.getEnvironment()).toBe(ENVIRONMENT_SANDBOX)
  })

  it('accepts a Config instance with an explicit environment', () => {
    const config = Config.collection('sub', 'user', 'key', '')
    const collection = MomoApi.collection(config, ENVIRONMENT_MTN_CONGO)

    expect(collection.getBaseUrl()).toBe(PRODUCTION_URL)
    expect(collection.getEnvironment()).toBe(ENVIRONMENT_MTN_CONGO)
  })
})

describe('MomoApi.disbursement', () => {
  it('honours the requested production environment', () => {
    const disbursement = MomoApi.disbursement({
      environment: ENVIRONMENT_MTN_CONGO,
      ...credentials,
    })

    expect(disbursement).toBeInstanceOf(DisbursementApi)
    expect(disbursement.getBaseUrl()).toBe(PRODUCTION_URL)
    expect(disbursement.getEnvironment()).toBe(ENVIRONMENT_MTN_CONGO)
  })

  it('rejects a missing api key', () => {
    expect(() => MomoApi.disbursement({ ...credentials, apiKey: '' })).toThrow(
      'apiKey is required'
    )
  })
})

describe('MomoApi.create', () => {
  it('rejects an unknown environment', () => {
    expect(() => MomoApi.create('mtnatlantis')).toThrow(
      "Unknown environment: 'mtnatlantis'"
    )
  })

  it('builds products bound to the instance environment', () => {
    const momo = MomoApi.create(ENVIRONMENT_MTN_CONGO)
    const config = Config.collection('sub', 'user', 'key', '')

    expect(momo.getCollection(config).getBaseUrl()).toBe(PRODUCTION_URL)
    expect(momo.getDisbursement(config).getEnvironment()).toBe(ENVIRONMENT_MTN_CONGO)
  })
})

describe('MomoApi.sandbox', () => {
  it('is available on the sandbox environment', () => {
    const momo = MomoApi.create(ENVIRONMENT_SANDBOX)

    expect(momo.sandbox('sub')).toBeDefined()
  })

  it('refuses to run against a production environment', () => {
    const momo = MomoApi.create(ENVIRONMENT_MTN_CONGO)

    expect(() => momo.sandbox('sub')).toThrow('Environment must be sandbox')
  })
})

describe('Config', () => {
  it('defaults the callback uri to an empty string', () => {
    expect(Config.collection('sub', 'user', 'key').callbackUri).toBe('')
  })

  it('builds the same config from either product factory', () => {
    const collection = Config.collection('sub', 'user', 'key', 'https://hook')
    const disbursement = Config.disbursement('sub', 'user', 'key', 'https://hook')

    expect({ ...collection }).toEqual({ ...disbursement })
  })

  it('leaves sandbox credentials blank apart from the subscription key', () => {
    const config = Config.sandbox('sub')

    expect(config.subscriptionKey).toBe('sub')
    expect(config.apiUser).toBe('')
    expect(config.apiKey).toBe('')
    expect(config.callbackUri).toBe('')
  })

  it('derives a new config with a different callback uri', () => {
    const config = Config.collection('sub', 'user', 'key', '')
    const updated = config.withCallbackUri('https://example.com/hook')

    expect(updated.callbackUri).toBe('https://example.com/hook')
    expect(updated.subscriptionKey).toBe('sub')
    expect(config.callbackUri).toBe('')
  })
})
