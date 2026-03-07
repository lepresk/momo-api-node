import { AirtelConfig } from '../models/AirtelConfig.js'
import { AirtelTransaction } from '../models/AirtelTransaction.js'
import { AccountBalance } from '../models/AccountBalance.js'
import { TokenCache } from '../support/TokenCache.js'
import { generateUUID } from '../support/uuid.js'
import { createException } from '../exceptions/MomoException.js'

export class AirtelCollectionApi {
  private readonly config: AirtelConfig
  private readonly baseUrl: string
  private readonly tokenCache = new TokenCache()

  constructor(config: AirtelConfig, baseUrl: string) {
    this.config = config
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw createException(response.status, text || undefined)
    }
    return response.json() as Promise<T>
  }

  async getAccessToken(): Promise<string> {
    const cached = this.tokenCache.get()
    if (cached) return cached

    const response = await fetch(`${this.baseUrl}/auth/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'client_credentials',
      }),
    })

    const data = await this.handleResponse<{ access_token: string; expires_in: number }>(response)
    this.tokenCache.set(data.access_token, data.expires_in)
    return data.access_token
  }

  async requestToPay(
    amount: string,
    phone: string,
    reference: string,
  ): Promise<string> {
    const token = await this.getAccessToken()
    const externalId = generateUUID()

    const body = {
      reference,
      subscriber: {
        country: this.config.country,
        currency: this.config.currency,
        msisdn: phone,
      },
      transaction: {
        amount: parseFloat(amount),
        country: this.config.country,
        currency: this.config.currency,
        id: externalId,
      },
    }

    const response = await fetch(`${this.baseUrl}/merchant/v1/payments/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Country': this.config.country,
        'X-Currency': this.config.currency,
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      body: JSON.stringify(body),
    })

    await this.handleResponse(response)
    return externalId
  }

  async getPaymentStatus(externalId: string): Promise<AirtelTransaction> {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.baseUrl}/standard/v1/payments/${encodeURIComponent(externalId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Country': this.config.country,
          'X-Currency': this.config.currency,
          'Accept': '*/*',
        },
      },
    )

    const data = await this.handleResponse<{ data: { transaction: Record<string, unknown> } }>(response)
    return AirtelTransaction.parse(data.data.transaction)
  }

  async getBalance(): Promise<AccountBalance> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}/standard/v1/users/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Country': this.config.country,
        'X-Currency': this.config.currency,
        'Accept': '*/*',
      },
    })

    const data = await this.handleResponse<{ data: { balance: string; currency: string } }>(response)
    return AccountBalance.parse({
      availableBalance: data.data.balance,
      currency: data.data.currency,
    })
  }
}
