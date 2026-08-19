import { AbstractAirtelApi } from './AbstractAirtelApi.js'
import { AirtelTransaction } from '../models/AirtelTransaction.js'
import { generateUUID } from '../support/uuid.js'

export class AirtelDisbursementApi extends AbstractAirtelApi {
  /**
   * Send money to a payee. Returns the externalId to poll with
   * {@link getTransferStatus}.
   */
  async transfer(amount: string, phone: string, reference: string): Promise<string> {
    if (!this.config.encryptedPin) {
      throw new Error('encryptedPin is required for disbursement transfers')
    }

    const token = await this.getAccessToken()
    const externalId = generateUUID()

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
          id: externalId,
        },
      }),
    })

    await this.readAirtel(response)
    return externalId
  }

  async getTransferStatus(externalId: string): Promise<AirtelTransaction> {
    return this.getTransaction(
      `/standard/v1/disbursements/${encodeURIComponent(externalId)}`,
      externalId
    )
  }
}
