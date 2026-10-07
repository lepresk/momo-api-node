import { AbstractApiProduct } from './AbstractApiProduct.js'
import { PaymentRequest } from '../models/PaymentRequest.js'
import { TransferRequest } from '../models/TransferRequest.js'
import { RefundRequest } from '../models/RefundRequest.js'
import { Transaction } from '../models/Transaction.js'

/**
 * Every write method takes an optional `referenceId`: a UUID to use as the
 * reference id instead of a random one, so the operation can be queried, and
 * not resent, even if the response never arrives.
 */
export class DisbursementApi extends AbstractApiProduct {
  protected readonly product = 'disbursement'

  /** Deposit funds into a customer account. */
  async deposit(request: PaymentRequest, referenceId?: string): Promise<string> {
    return this.submit('/disbursement/v1_0/deposit', request.toBody(), referenceId)
  }

  async getDepositStatus(depositId: string): Promise<Transaction> {
    return this.getTransaction(`/disbursement/v1_0/deposit/${depositId}`)
  }

  /** Transfer funds to a payee. */
  async transfer(request: TransferRequest, referenceId?: string): Promise<string> {
    return this.submit('/disbursement/v1_0/transfer', request.toBody(), referenceId)
  }

  async getTransferStatus(transferId: string): Promise<Transaction> {
    return this.getTransaction(`/disbursement/v1_0/transfer/${transferId}`)
  }

  /** Refund a previously collected payment. */
  async refund(request: RefundRequest, referenceId?: string): Promise<string> {
    return this.submit('/disbursement/v1_0/refund', request.toBody(), referenceId)
  }

  async getRefundStatus(refundId: string): Promise<Transaction> {
    return this.getTransaction(`/disbursement/v1_0/refund/${refundId}`)
  }
}
