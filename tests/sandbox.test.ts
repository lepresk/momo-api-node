import { describe, it, expect, vi, afterEach } from 'vitest'
import { SandboxApi } from '../src/products/SandboxApi.js'
import {
  ConflictException,
  InvalidSubscriptionKeyException,
} from '../src/exceptions/MomoException.js'
import { apiUser, apiKey } from './fixtures/index.js'

function mockFetch(responses: Array<{ status: number; body: unknown }>) {
  let callCount = 0
  return vi.fn().mockImplementation(() => {
    const response = responses[callCount] ?? responses[responses.length - 1]
    callCount++
    const body = typeof response.body === 'string' ? response.body : JSON.stringify(response.body)
    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: () => Promise.resolve(response.body),
      text: () => Promise.resolve(body),
    })
  })
}

const BASE_URL = 'https://sandbox.momodeveloper.mtn.com'
const SUBSCRIPTION_KEY = 'test-subscription-key'

describe('SandboxApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('createApiUser', () => {
    it('returns the apiUser UUID on success', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 201, body: '' }]))

      const api = new SandboxApi(SUBSCRIPTION_KEY, BASE_URL)
      const result = await api.createApiUser('my-user-uuid', 'https://example.com')

      expect(result).toBe('my-user-uuid')
    })

    it('throws ConflictException when the API user already exists (409)', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 409, body: 'Conflict' }]))

      const api = new SandboxApi(SUBSCRIPTION_KEY, BASE_URL)
      await expect(api.createApiUser('existing-uuid', 'https://example.com')).rejects.toThrow(
        ConflictException
      )
    })

    it('throws InvalidSubscriptionKeyException on 401', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 401, body: '' }]))

      const api = new SandboxApi(SUBSCRIPTION_KEY, BASE_URL)
      await expect(api.createApiUser('some-uuid', 'https://example.com')).rejects.toThrow(
        InvalidSubscriptionKeyException
      )
    })
  })

  describe('getApiUser', () => {
    it('returns the API user details on success', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 200, body: apiUser }]))

      const api = new SandboxApi(SUBSCRIPTION_KEY, BASE_URL)
      const result = await api.getApiUser('my-user-uuid')

      expect(result).toEqual(apiUser)
    })

    it('throws an exception on 404', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 404, body: 'Not found' }]))

      const api = new SandboxApi(SUBSCRIPTION_KEY, BASE_URL)
      await expect(api.getApiUser('unknown-uuid')).rejects.toThrow()
    })
  })

  describe('createApiKey', () => {
    it('returns the generated apiKey string on success', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 201, body: apiKey }]))

      const api = new SandboxApi(SUBSCRIPTION_KEY, BASE_URL)
      const result = await api.createApiKey('my-user-uuid')

      expect(result).toBe('generated-api-key-xyz')
    })

    it('throws an exception on error', async () => {
      vi.stubGlobal('fetch', mockFetch([{ status: 404, body: 'Not found' }]))

      const api = new SandboxApi(SUBSCRIPTION_KEY, BASE_URL)
      await expect(api.createApiKey('unknown-uuid')).rejects.toThrow()
    })
  })
})
