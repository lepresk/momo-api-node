import { createException } from '../exceptions/MomoException.js'

export class SandboxApi {
  private readonly subscriptionKey: string
  private readonly baseUrl: string

  constructor(subscriptionKey: string, baseUrl: string) {
    this.subscriptionKey = subscriptionKey
    this.baseUrl = baseUrl
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw createException(response.status, text || undefined)
    }

    const text = await response.text()
    if (!text) {
      return {} as T
    }
    return JSON.parse(text) as T
  }

  async createApiUser(apiUser: string, callbackHost: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1_0/apiuser`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        'X-Reference-Id': apiUser,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ providerCallbackHost: callbackHost }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw createException(response.status, text || undefined)
    }

    return apiUser
  }

  async getApiUser(apiUser: string): Promise<object> {
    const response = await fetch(`${this.baseUrl}/v1_0/apiuser/${apiUser}`, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    })

    return this.handleResponse<object>(response)
  }

  async createApiKey(apiUser: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1_0/apiuser/${apiUser}/apikey`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    })

    const data = await this.handleResponse<Record<string, unknown>>(response)
    return data['apiKey'] as string
  }
}
