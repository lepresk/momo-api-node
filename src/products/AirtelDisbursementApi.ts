import { AbstractAirtelApi } from './AbstractAirtelApi.js'
import { AirtelTransaction } from '../models/AirtelTransaction.js'
import { generateUUID, assertUUID } from '../support/uuid.js'

export class AirtelDisbursementApi extends AbstractAirtelApi {
  /**
   * Send money to a payee. Returns the externalId to poll with
   * {@link getTransferStatus}.
   *
   * @param transactionId UUID to use as the externalId instead of a random one,
   *   so the transfer can be queried, and not resent, even if the response
   *   never arrives
   */
  async transfer(
    amount: string,
    phone: string,
    reference: string,
    transactionId: string = generateUUID()
  ): Promise<string> {
    if (!this.config.encryptedPin) {
      throw new Error('encryptedPin is required for disbursement transfers')
    }

    assertUUID(transactionId, 'transactionId')
    const token = await this.getAccessToken()

    const response = await this.fetchImpl(`${this.baseUrl}/standard/v1/disbursements/`, {
      method: 'POST',
      headers: {
        ...this.airtelHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payee: { msisdn: this.msisdn(phone) },
        reference,
        pin: this.config.encryptedPin,
        transaction: {
          amount: parseInt(amount, 10).toString(),
          id: transactionId,
        },
      }),
    })

    await this.readAirtel(response)
    return transactionId
  }

  async getTransferStatus(externalId: string): Promise<AirtelTransaction> {
    return this.getTransaction(
      `/standard/v1/disbursements/${encodeURIComponent(externalId)}`,
      externalId
    )
  }
}
