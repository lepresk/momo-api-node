import { Config } from '../models/Config.js'
import { ApiToken } from '../models/ApiToken.js'
import { AccountBalance } from '../models/AccountBalance.js'
import { PaymentRequest } from '../models/PaymentRequest.js'
import { TransferRequest } from '../models/TransferRequest.js'
import { RefundRequest } from '../models/RefundRequest.js'
import { Transaction } from '../models/Transaction.js'
import { createException } from '../exceptions/MomoException.js'
import { generateUUID } from '../support/uuid.js'
import { TokenCache } from '../support/TokenCache.js'

export class DisbursementApi {
  private readonly config: Config
  private readonly baseUrl: string
  private readonly environment: string
  private readonly tokenCache = new TokenCache()

  constructor(config: Config, baseUrl: string, environment: string) {
    this.config = config
    this.baseUrl = baseUrl
    this.environment = environment
  }

  private getBasicAuth(): string {
    const credentials = `${this.config.apiUser}:${this.config.apiKey}`
    return `Basic ${btoa(credentials)}`
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw createException(response.status, text || undefined)
    }
    return response.json() as Promise<T>
  }

  async getAccessToken(): Promise<ApiToken> {
    const cached = this.tokenCache.get()
    if (cached) return ApiToken.fromObject({ access_token: cached, token_type: "access_token", expires_in: 0 })

    const response = await fetch(`${this.baseUrl}/disbursement/token/`, {
      method: 'POST',
      headers: {
        'Authorization': this.getBasicAuth(),
        'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
      },
    })

    const data = await this.handleResponse<Record<string, unknown>>(response)
    const token = ApiToken.fromObject(data)
    this.tokenCache.set(token.getAccessToken(), token.getExpiresIn())
    return token
  }

  async getBalance(): Promise<AccountBalance> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}/disbursement/v1_0/account/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.getAccessToken()}`,
        'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
        'X-Target-Environment': this.environment,
      },
    })

    const data = await this.handleResponse<Record<string, unknown>>(response)
    return AccountBalance.parse(data)
  }

  async deposit(request: PaymentRequest): Promise<string> {
    const referenceId = generateUUID()
    const token = await this.getAccessToken()

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token.getAccessToken()}`,
      'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
      'X-Target-Environment': this.environment,
      'X-Reference-Id': referenceId,
      'Content-Type': 'application/json',
    }

    if (this.config.callbackUri) {
      headers['X-Callback-Url'] = this.config.callbackUri
    }

    const response = await fetch(`${this.baseUrl}/disbursement/v1_0/deposit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request.toBody()),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw createException(response.status, text || undefined)
    }

    return referenceId
  }

  async getDepositStatus(depositId: string): Promise<Transaction> {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.baseUrl}/disbursement/v1_0/deposit/${depositId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.getAccessToken()}`,
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
          'X-Target-Environment': this.environment,
        },
      }
    )

    const data = await this.handleResponse<Record<string, unknown>>(response)
    return Transaction.parse(data)
  }

  async transfer(request: TransferRequest): Promise<string> {
    const referenceId = generateUUID()
    const token = await this.getAccessToken()

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token.getAccessToken()}`,
      'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
      'X-Target-Environment': this.environment,
      'X-Reference-Id': referenceId,
      'Content-Type': 'application/json',
    }

    if (this.config.callbackUri) {
      headers['X-Callback-Url'] = this.config.callbackUri
    }

    const response = await fetch(`${this.baseUrl}/disbursement/v1_0/transfer`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request.toBody()),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw createException(response.status, text || undefined)
    }

    return referenceId
  }

  async getTransferStatus(transferId: string): Promise<Transaction> {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.baseUrl}/disbursement/v1_0/transfer/${transferId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.getAccessToken()}`,
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
          'X-Target-Environment': this.environment,
        },
      }
    )

    const data = await this.handleResponse<Record<string, unknown>>(response)
    return Transaction.parse(data)
  }

  async refund(request: RefundRequest): Promise<string> {
    const referenceId = generateUUID()
    const token = await this.getAccessToken()

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token.getAccessToken()}`,
      'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
      'X-Target-Environment': this.environment,
      'X-Reference-Id': referenceId,
      'Content-Type': 'application/json',
    }

    if (this.config.callbackUri) {
      headers['X-Callback-Url'] = this.config.callbackUri
    }

    const response = await fetch(`${this.baseUrl}/disbursement/v1_0/refund`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request.toBody()),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw createException(response.status, text || undefined)
    }

    return referenceId
  }

  async getRefundStatus(refundId: string): Promise<Transaction> {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.baseUrl}/disbursement/v1_0/refund/${refundId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.getAccessToken()}`,
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
          'X-Target-Environment': this.environment,
        },
      }
    )

    const data = await this.handleResponse<Record<string, unknown>>(response)
    return Transaction.parse(data)
  }
  async checkAccountHolder(phone: string): Promise<boolean> {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.baseUrl}/disbursement/v1_0/accountholder/msisdn/${encodeURIComponent(phone)}/active`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.getAccessToken()}`,
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
          'X-Target-Environment': this.environment,
        },
      },
    )

    const data = await this.handleResponse<{ result: boolean }>(response)
    return data.result
  }
}