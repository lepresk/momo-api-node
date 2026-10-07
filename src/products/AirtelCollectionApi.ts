import { AbstractAirtelApi } from './AbstractAirtelApi.js'
import { AirtelTransaction } from '../models/AirtelTransaction.js'
import { generateUUID, assertUUID } from '../support/uuid.js'

export class AirtelCollectionApi extends AbstractAirtelApi {
  /**
   * Initiate a payment request. Returns the externalId to poll with
   * {@link getPaymentStatus}.
   *
   * @param transactionId UUID to use as the externalId instead of a random one,
   *   so the payment can be queried even if the response never arrives
   */
  async requestToPay(
    amount: string,
    phone: string,
    reference: string,
    transactionId: string = generateUUID()
  ): Promise<string> {
    assertUUID(transactionId, 'transactionId')
    const token = await this.getAccessToken()

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
          id: transactionId,
        },
      }),
    })

    await this.readAirtel(response)
    return transactionId
  }

  async getPaymentStatus(externalId: string): Promise<AirtelTransaction> {
    return this.getTransaction(
      `/standard/v1/payments/${encodeURIComponent(externalId)}`,
      externalId
    )
  }
}
