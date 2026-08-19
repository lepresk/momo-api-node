import { describe, it, expect, vi } from 'vitest'
import { jsonResponse, sequence } from './fixtures/fetch.js'
import { CollectionApi } from '../src/products/CollectionApi.js'
import { DisbursementApi } from '../src/products/DisbursementApi.js'
import { AirtelCollectionApi } from '../src/products/AirtelCollectionApi.js'
import { AirtelDisbursementApi } from '../src/products/AirtelDisbursementApi.js'
import { Config } from '../src/models/Config.js'
import { AirtelConfig } from '../src/models/AirtelConfig.js'
import { PaymentRequest } from '../src/models/PaymentRequest.js'
import { TransferRequest } from '../src/models/TransferRequest.js'
import { RefundRequest } from '../src/models/RefundRequest.js'
import { MomoException, ResourceNotFoundException } from '../src/exceptions/MomoException.js'
import { tokenSuccess } from './fixtures/index.js'



const config = Config.collection('sub', 'user', 'key', '')
const BASE_URL = 'https://sandbox.momodeveloper.mtn.com'
const ENVIRONMENT = 'sandbox'

const payment = PaymentRequest.make('100', '242068511358', 'ORDER-1')
const transfer = TransferRequest.make('100', '242068511358', 'PAY-1')
const refund = RefundRequest.make('100', 'origin-ref', 'REFUND-1')

describe('MTN request headers', () => {
  it('asks for a JSON response on requestToPay', async () => {
    const fetchImpl = sequence(jsonResponse(tokenSuccess, 200), jsonResponse('', 202))
    const api = new CollectionApi(config, BASE_URL, ENVIRONMENT, fetchImpl)

    await api.requestToPay(payment)

    const headers = fetchImpl.mock.calls[1][1].headers as Record<string, string>
    expect(headers['Accept']).toBe('application/json')
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('asks for a JSON response on getPaymentStatus', async () => {
    const fetchImpl = sequence(jsonResponse(tokenSuccess, 200), jsonResponse({ status: 'SUCCESSFUL' }, 200))
    const api = new CollectionApi(config, BASE_URL, ENVIRONMENT, fetchImpl)

    await api.getPaymentStatus('payment-id')

    const headers = fetchImpl.mock.calls[1][1].headers as Record<string, string>
    expect(headers['Accept']).toBe('application/json')
  })

  it('asks for a JSON response on deposit', async () => {
    const fetchImpl = sequence(jsonResponse(tokenSuccess, 200), jsonResponse('', 202))
    const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT, fetchImpl)

    await api.deposit(payment)

    const headers = fetchImpl.mock.calls[1][1].headers as Record<string, string>
    expect(headers['Accept']).toBe('application/json')
  })
})

describe('MTN accepted-status contract', () => {
  it('accepts 202 on requestToPay', async () => {
    const fetchImpl = sequence(jsonResponse(tokenSuccess, 200), jsonResponse('', 202))
    const api = new CollectionApi(config, BASE_URL, ENVIRONMENT, fetchImpl)

    await expect(api.requestToPay(payment)).resolves.toEqual(expect.any(String))
  })

  it('rejects a non-202 success on requestToPay', async () => {
    const fetchImpl = sequence(jsonResponse(tokenSuccess, 200), jsonResponse('', 200))
    const api = new CollectionApi(config, BASE_URL, ENVIRONMENT, fetchImpl)

    await expect(api.requestToPay(payment)).rejects.toThrow(MomoException)
    await expect(
      new CollectionApi(
        config,
        BASE_URL,
        ENVIRONMENT,
        sequence(jsonResponse(tokenSuccess, 200), jsonResponse('', 200))
      ).requestToPay(payment)
    ).rejects.toThrow('Operation failed with status 200')
  })

  it('rejects a non-202 success on deposit', async () => {
    const fetchImpl = sequence(jsonResponse(tokenSuccess, 200), jsonResponse('', 201))
    const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT, fetchImpl)

    await expect(api.deposit(payment)).rejects.toThrow(MomoException)
  })

  it('rejects a non-202 success on transfer', async () => {
    const fetchImpl = sequence(jsonResponse(tokenSuccess, 200), jsonResponse('', 200))
    const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT, fetchImpl)

    await expect(api.transfer(transfer)).rejects.toThrow(MomoException)
  })

  it('rejects a non-202 success on refund', async () => {
    const fetchImpl = sequence(jsonResponse(tokenSuccess, 200), jsonResponse('', 200))
    const api = new DisbursementApi(config, BASE_URL, ENVIRONMENT, fetchImpl)

    await expect(api.refund(refund)).rejects.toThrow(MomoException)
  })
})

describe('Airtel status payload', () => {
  const airtelConfig = AirtelConfig.collection('client-id', 'client-secret')

  it('reports a missing transaction node as ResourceNotFoundException', async () => {
    const fetchImpl = sequence(
      jsonResponse({ access_token: 'token', expires_in: 3600 }, 200),
      jsonResponse({ data: {} }, 200)
    )
    const api = new AirtelCollectionApi(airtelConfig, 'https://airtel.test', fetchImpl)

    await expect(api.getPaymentStatus('ext-1')).rejects.toThrow(ResourceNotFoundException)
  })

  it('reports a missing data node as ResourceNotFoundException', async () => {
    const fetchImpl = sequence(
      jsonResponse({ access_token: 'token', expires_in: 3600 }, 200),
      jsonResponse({}, 200)
    )
    const api = new AirtelCollectionApi(airtelConfig, 'https://airtel.test', fetchImpl)

    await expect(api.getPaymentStatus('ext-1')).rejects.toThrow(ResourceNotFoundException)
  })

  it('reports a missing transaction node on disbursement as ResourceNotFoundException', async () => {
    const fetchImpl = sequence(
      jsonResponse({ access_token: 'token', expires_in: 3600 }, 200),
      jsonResponse({ data: {} }, 200)
    )
    const api = new AirtelDisbursementApi(
      AirtelConfig.disbursement('client-id', 'client-secret', 'pin'),
      'https://airtel.test',
      fetchImpl
    )

    await expect(api.getTransferStatus('ext-1')).rejects.toThrow(ResourceNotFoundException)
  })

  it('parses a well-formed transaction node', async () => {
    const fetchImpl = sequence(
      jsonResponse({ access_token: 'token', expires_in: 3600 }, 200),
      jsonResponse({ data: { transaction: { id: 'ext-1', status: 'TS' } } }, 200)
    )
    const api = new AirtelCollectionApi(airtelConfig, 'https://airtel.test', fetchImpl)

    const transaction = await api.getPaymentStatus('ext-1')

    expect(transaction.getId()).toBe('ext-1')
    expect(transaction.isSuccessful()).toBe(true)
  })
})
