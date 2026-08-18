import { AirtelConfig } from '../models/AirtelConfig.js'
import { AirtelTransaction } from '../models/AirtelTransaction.js'
import { AccountBalance } from '../models/AccountBalance.js'
import { ResourceNotFoundException } from '../exceptions/MomoException.js'
import { FetchLike, resolveFetch, readJson } from '../support/http.js'
import { TokenCache } from '../support/TokenCache.js'

/**
 * Shared behaviour of the Airtel Money products. Collection and Disbursement
 * authenticate identically and read status from the same envelope shape.
 */
export abstract class AbstractAirtelApi {
  protected readonly config: AirtelConfig
  protected readonly baseUrl: string
  protected readonly fetchImpl: FetchLike
  protected readonly tokenCache = new TokenCache()

  constructor(config: AirtelConfig, baseUrl: string, fetchImpl?: FetchLike) {
    this.config = config
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.fetchImpl = resolveFetch(fetchImpl)
  }

  getConfig(): AirtelConfig {
    return this.config
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  /** Headers every authenticated Airtel call carries. */
  protected airtelHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
      'X-Country': this.config.country,
      'X-Currency': this.config.currency,
      'Accept': '*/*',
    }
  }

  /** OAuth2 client-credentials token, cached for its lifetime minus a minute. */
  async getAccessToken(): Promise<string> {
    const cached = this.tokenCache.get()
    if (cached) return cached

    const response = await this.fetchImpl(`${this.baseUrl}/auth/oauth2/token`, {
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

    const data = await readJson<{ access_token: string; expires_in: number }>(response)
    this.tokenCache.set(data.access_token, data.expires_in)
    return data.access_token
  }

  /**
   * Read a transaction from the `{ data: { transaction } }` envelope.
   *
   * @throws ResourceNotFoundException when Airtel answers without a transaction
   */
  protected async getTransaction(path: string, externalId: string): Promise<AirtelTransaction> {
    const token = await this.getAccessToken()

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.airtelHeaders(token),
    })

    const data = await readJson<{ data?: { transaction?: Record<string, unknown> } }>(response)
    const transaction = data.data?.transaction
    if (!transaction) {
      throw new ResourceNotFoundException(
        `Transaction not found in Airtel system for externalId: ${externalId}`
      )
    }
    return AirtelTransaction.parse(transaction)
  }

  async getBalance(): Promise<AccountBalance> {
    const token = await this.getAccessToken()

    const response = await this.fetchImpl(`${this.baseUrl}/standard/v1/users/balance`, {
      method: 'GET',
      headers: this.airtelHeaders(token),
    })

    const data = await readJson<{ data?: { balance?: string; currency?: string } }>(response)
    return AccountBalance.parse({
      availableBalance: data.data?.balance ?? '0',
      currency: data.data?.currency ?? '',
    })
  }
}
