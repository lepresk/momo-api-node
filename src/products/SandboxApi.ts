import { FetchLike, resolveFetch, readJsonAllowEmpty } from '../support/http.js'

export class SandboxApi {
  private readonly subscriptionKey: string
  private readonly baseUrl: string
  private readonly fetchImpl: FetchLike

  constructor(subscriptionKey: string, baseUrl: string, fetchImpl?: FetchLike) {
    this.subscriptionKey = subscriptionKey
    this.baseUrl = baseUrl
    this.fetchImpl = resolveFetch(fetchImpl)
  }

  private headers(contentType = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      'Accept': 'application/json',
    }
    if (contentType) {
      headers['Content-Type'] = 'application/json'
    }
    return headers
  }

  /** Provision an API user. Returns the reference id you passed in. */
  async createApiUser(apiUser: string, callbackHost: string): Promise<string> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1_0/apiuser`, {
      method: 'POST',
      headers: { ...this.headers(true), 'X-Reference-Id': apiUser },
      body: JSON.stringify({ providerCallbackHost: callbackHost }),
    })

    await readJsonAllowEmpty(response)
    return apiUser
  }

  async getApiUser(apiUser: string): Promise<object> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1_0/apiuser/${apiUser}`, {
      method: 'GET',
      headers: this.headers(),
    })

    return readJsonAllowEmpty<object>(response)
  }

  async createApiKey(apiUser: string): Promise<string> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1_0/apiuser/${apiUser}/apikey`, {
      method: 'POST',
      headers: this.headers(),
    })

    const data = await readJsonAllowEmpty<{ apiKey: string }>(response)
    return data.apiKey
  }
}
