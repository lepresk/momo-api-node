import { describe, it, expect, vi, afterEach } from 'vitest'
import { MomoApi, ENVIRONMENT_SANDBOX } from '../src/MomoApi.js'
import { AirtelApi, AIRTEL_STAGING_URL } from '../src/AirtelApi.js'
import { AirtelConfig } from '../src/models/AirtelConfig.js'
import { CollectionApi } from '../src/products/CollectionApi.js'
import { Config } from '../src/models/Config.js'
import { tokenSuccess, balance } from './fixtures/index.js'

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response
}

const credentials = {
  subscriptionKey: 'sub',
  apiUser: 'user',
  apiKey: 'key',
}

describe('custom fetch implementation', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is used by a product built directly', async () => {
    const spy = vi.fn().mockResolvedValue(jsonResponse(tokenSuccess))
    const api = new CollectionApi(
      Config.collection('sub', 'user', 'key'),
      'https://example.test',
      ENVIRONMENT_SANDBOX,
      spy
    )

    await api.getAccessToken()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toBe('https://example.test/collection/token/')
  })

  it('is accepted by the static factories through options', async () => {
    const spy = vi.fn().mockResolvedValue(jsonResponse(tokenSuccess))

    await MomoApi.collection({ ...credentials, fetchImpl: spy }).getAccessToken()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('is accepted by MomoApi.disbursement through options', async () => {
    const spy = vi.fn().mockResolvedValue(jsonResponse(tokenSuccess))

    await MomoApi.disbursement({ ...credentials, fetchImpl: spy }).getAccessToken()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('is accepted by MomoApi.create and inherited by its products', async () => {
    const spy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(tokenSuccess))
      .mockResolvedValueOnce(jsonResponse(balance))

    const momo = MomoApi.create(ENVIRONMENT_SANDBOX, spy)
    await momo.getDisbursement(Config.disbursement('sub', 'user', 'key')).getBalance()

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('is inherited by the sandbox product', async () => {
    const spy = vi.fn().mockResolvedValue(jsonResponse({ apiKey: 'generated' }))

    const momo = MomoApi.create(ENVIRONMENT_SANDBOX, spy)
    await momo.sandbox('sub').createApiKey('api-user')

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('does not leak between clients', async () => {
    const spy = vi.fn().mockResolvedValue(jsonResponse(tokenSuccess))
    const globalSpy = vi.fn().mockResolvedValue(jsonResponse(tokenSuccess))
    vi.stubGlobal('fetch', globalSpy)

    await MomoApi.collection({ ...credentials, fetchImpl: spy }).getAccessToken()
    await MomoApi.collection(credentials).getAccessToken()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(globalSpy).toHaveBeenCalledTimes(1)
  })

  it('falls back to the global fetch when none is supplied', async () => {
    const globalSpy = vi.fn().mockResolvedValue(jsonResponse(tokenSuccess))
    vi.stubGlobal('fetch', globalSpy)

    await MomoApi.collection(credentials).getAccessToken()

    expect(globalSpy).toHaveBeenCalledTimes(1)
  })

  it('is accepted by AirtelApi.create', async () => {
    const spy = vi
      .fn()
      .mockResolvedValue(jsonResponse({ access_token: 'airtel-token', expires_in: 3600 }))
    const config = AirtelConfig.collection('client-id', 'client-secret')

    await AirtelApi.create('staging', spy).getCollection(config).getAccessToken()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toBe(`${AIRTEL_STAGING_URL}/auth/oauth2/token`)
  })

  it('is accepted by the AirtelApi shorthand factories', async () => {
    const spy = vi
      .fn()
      .mockResolvedValue(jsonResponse({ access_token: 'airtel-token', expires_in: 3600 }))

    await AirtelApi.collection(
      'staging',
      { clientId: 'client-id', clientSecret: 'client-secret' },
      spy
    ).getAccessToken()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('no longer exposes process-global fetch state', () => {
    expect(MomoApi).not.toHaveProperty('useFetch')
    expect(MomoApi).not.toHaveProperty('getFetch')
  })
})
