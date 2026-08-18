import { AbstractApiProduct } from './AbstractApiProduct.js'
import { PaymentRequest } from '../models/PaymentRequest.js'
import { TransferRequest } from '../models/TransferRequest.js'
import { RefundRequest } from '../models/RefundRequest.js'
import { Transaction } from '../models/Transaction.js'

export class DisbursementApi extends AbstractApiProduct {
  protected readonly product = 'disbursement'

  /** Deposit funds into a customer account. */
  async deposit(request: PaymentRequest): Promise<string> {
    return this.submit('/disbursement/v1_0/deposit', request.toBody())
  }

  async getDepositStatus(depositId: string): Promise<Transaction> {
    return this.getTransaction(`/disbursement/v1_0/deposit/${depositId}`)
  }

  /** Transfer funds to a payee. */
  async transfer(request: TransferRequest): Promise<string> {
    return this.submit('/disbursement/v1_0/transfer', request.toBody())
  }

  async getTransferStatus(transferId: string): Promise<Transaction> {
    return this.getTransaction(`/disbursement/v1_0/transfer/${transferId}`)
  }

  /** Refund a previously collected payment. */
  async refund(request: RefundRequest): Promise<string> {
    return this.submit('/disbursement/v1_0/refund', request.toBody())
  }

  async getRefundStatus(refundId: string): Promise<Transaction> {
    return this.getTransaction(`/disbursement/v1_0/refund/${refundId}`)
  }
}
