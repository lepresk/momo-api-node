import { AbstractAirtelApi } from './AbstractAirtelApi.js'
import { AirtelTransaction } from '../models/AirtelTransaction.js'
import { generateUUID } from '../support/uuid.js'

export class AirtelCollectionApi extends AbstractAirtelApi {
  /**
   * Initiate a payment request. Returns the externalId to poll with
   * {@link getPaymentStatus}.
   */
  async requestToPay(amount: string, phone: string, reference: string): Promise<string> {
    const token = await this.getAccessToken()
    const externalId = generateUUID()

    const response = await this.fetchImpl(`${this.baseUrl}/merchant/v1/payments/`, {
      method: 'POST',
      headers: {
        ...this.airtelHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference,
        subscriber: {
          country: this.config.country,
          currency: this.config.currency,
          msisdn: this.msisdn(phone),
        },
        transaction: {
          amount: parseFloat(amount),
          country: this.config.country,
          currency: this.config.currency,
          id: externalId,
        },
      }),
    })

    await this.readAirtel(response)
    return externalId
  }

  async getPaymentStatus(externalId: string): Promise<AirtelTransaction> {
    return this.getTransaction(
      `/standard/v1/payments/${encodeURIComponent(externalId)}`,
      externalId
    )
  }
}
