import { AbstractApiProduct } from './AbstractApiProduct.js'
import { DEFAULT_CURRENCY } from '../models/currency.js'
import { PaymentRequest } from '../models/PaymentRequest.js'
import { Transaction } from '../models/Transaction.js'

export class CollectionApi extends AbstractApiProduct {
  protected readonly product = 'collection'

  /**
   * Request a payment from a consumer. The payer authorizes it out of band, so
   * this returns a reference id to poll with {@link getPaymentStatus}.
   */
  async requestToPay(request: PaymentRequest): Promise<string> {
    return this.submit('/collection/v1_0/requesttopay', request.toBody())
  }

  async getPaymentStatus(paymentId: string): Promise<Transaction> {
    return this.getTransaction(`/collection/v1_0/requesttopay/${paymentId}`)
  }

  /** Shorthand for a payment with no message or note. */
  async quickPay(
    amount: string,
    phone: string,
    reference: string,
    currency: string = DEFAULT_CURRENCY
  ): Promise<string> {
    return this.requestToPay(PaymentRequest.make(amount, phone, reference, currency))
  }
}
