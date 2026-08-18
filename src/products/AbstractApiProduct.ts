import { Config } from '../models/Config.js'
import { ApiToken } from '../models/ApiToken.js'
import { AccountBalance } from '../models/AccountBalance.js'
import { Transaction } from '../models/Transaction.js'
import { FetchLike, resolveFetch, assertStatus, readJson } from '../support/http.js'
import { TokenCache } from '../support/TokenCache.js'
import { generateUUID } from '../support/uuid.js'

/**
 * Shared behaviour of the MTN products. Collection and Disbursement expose the
 * same endpoints under a different path segment, so everything but the endpoint
 * list lives here.
 */
export abstract class AbstractApiProduct {
  protected readonly config: Config
  protected readonly baseUrl: string
  protected readonly environment: string
  protected readonly fetchImpl: FetchLike
  protected readonly tokenCache = new TokenCache()

  /** `collection` or `disbursement` — the first segment of every endpoint. */
  protected abstract readonly product: string

  constructor(config: Config, baseUrl: string, environment: string, fetchImpl?: FetchLike) {
    this.config = config
    this.baseUrl = baseUrl
    this.environment = environment
    this.fetchImpl = resolveFetch(fetchImpl)
  }

  getConfig(): Config {
    return this.config
  }

  getSubscriptionKey(): string {
    return this.config.subscriptionKey
  }

  getEnvironment(): string {
    return this.environment
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  private getBasicAuth(): string {
    return `Basic ${btoa(`${this.config.apiUser}:${this.config.apiKey}`)}`
  }

  /** Headers every authenticated call carries. */
  protected authHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
      'X-Target-Environment': this.environment,
      'Accept': 'application/json',
    }
  }

  /** {@link authHeaders} plus what a write request needs. */
  protected writeHeaders(token: string, referenceId: string): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.authHeaders(token),
      'X-Reference-Id': referenceId,
      'Content-Type': 'application/json',
    }
    if (this.config.callbackUri) {
      headers['X-Callback-Url'] = this.config.callbackUri
    }
    return headers
  }

  /**
   * POST a request and return the generated reference id. The API answers
   * `202 Accepted` and reports the outcome asynchronously.
   */
  protected async submit(path: string, body: object): Promise<string> {
    const referenceId = generateUUID()
    const token = await this.getAccessToken()

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.writeHeaders(token.getAccessToken(), referenceId),
      body: JSON.stringify(body),
    })

    await assertStatus(response, 202)
    return referenceId
  }

  protected async getTransaction(path: string): Promise<Transaction> {
    const token = await this.getAccessToken()

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.authHeaders(token.getAccessToken()),
    })

    return Transaction.parse(await readJson<Record<string, unknown>>(response))
  }

  /**
   * Create an access token for the other endpoints. Cached for its lifetime
   * minus a minute, so repeated calls do not re-authenticate.
   */
  async getAccessToken(): Promise<ApiToken> {
    const cached = this.tokenCache.get()
    if (cached) {
      return ApiToken.fromObject({
        access_token: cached,
        token_type: 'access_token',
        expires_in: 0,
      })
    }

    const response = await this.fetchImpl(`${this.baseUrl}/${this.product}/token/`, {
      method: 'POST',
      headers: {
        'Authorization': this.getBasicAuth(),
        'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
        'Accept': 'application/json',
      },
    })

    const token = ApiToken.fromObject(await readJson<Record<string, unknown>>(response))
    this.tokenCache.set(token.getAccessToken(), token.getExpiresIn())
    return token
  }

  /** Balance of your own account. */
  async getBalance(): Promise<AccountBalance> {
    const token = await this.getAccessToken()

    const response = await this.fetchImpl(
      `${this.baseUrl}/${this.product}/v1_0/account/balance`,
      { method: 'GET', headers: this.authHeaders(token.getAccessToken()) }
    )

    return AccountBalance.parse(await readJson<Record<string, unknown>>(response))
  }

  /** Whether an MSISDN is a registered, active account holder. */
  async checkAccountHolder(phone: string): Promise<boolean> {
    const token = await this.getAccessToken()

    const response = await this.fetchImpl(
      `${this.baseUrl}/${this.product}/v1_0/accountholder/msisdn/${encodeURIComponent(phone)}/active`,
      { method: 'GET', headers: this.authHeaders(token.getAccessToken()) }
    )

    const data = await readJson<{ result: boolean }>(response)
    return data.result
  }
}
