import { describe, it, expect, vi } from 'vitest'
import { jsonResponse, sequence } from './fixtures/fetch.js'
import { AirtelCollectionApi } from '../src/products/AirtelCollectionApi.js'
import { AirtelDisbursementApi } from '../src/products/AirtelDisbursementApi.js'
import { AirtelConfig } from '../src/models/AirtelConfig.js'
import { MomoException } from '../src/exceptions/MomoException.js'



const token = { access_token: 'token', expires_in: 3600 }

const collection = () => AirtelConfig.collection('id', 'secret')
const disbursement = () => AirtelConfig.disbursement('id', 'secret', 'pin')

describe('Airtel business failures returned with HTTP 200', () => {
  it('raises on requestToPay when the envelope reports failure', async () => {
    const fetchImpl = sequence(
      jsonResponse(token),
      jsonResponse({
        data: {},
        status: {
          response_code: 'DP00800001006',
          code: '500',
          success: false,
          message: 'Transaction is not permitted to the payee',
          result_code: 'ESB000011',
        },
      })
    )
    const api = new AirtelCollectionApi(collection(), 'https://airtel.test', fetchImpl)

    await expect(api.requestToPay('1000', '068511358', 'ORDER-1')).rejects.toThrow(
      'Transaction is not permitted to the payee'
    )
  })

  it('carries the Airtel result code on the raised error', async () => {
    const fetchImpl = sequence(
      jsonResponse(token),
      jsonResponse({
        status: { success: false, message: 'Invalid PIN', result_code: 'ESB000008' },
      })
    )
    const api = new AirtelDisbursementApi(disbursement(), 'https://airtel.test', fetchImpl)

    const error = await api.transfer('1000', '068511358', 'PAY-1').catch((e) => e)

    expect(error).toBeInstanceOf(MomoException)
    expect(error.code).toBe('ESB000008')
    expect(error.message).toBe('Invalid PIN')
  })

  it('accepts a request whose envelope reports success', async () => {
    const fetchImpl = sequence(
      jsonResponse(token),
      jsonResponse({ data: {}, status: { success: true, message: 'Success' } })
    )
    const api = new AirtelCollectionApi(collection(), 'https://airtel.test', fetchImpl)

    await expect(api.requestToPay('1000', '068511358', 'ORDER-1')).resolves.toEqual(
      expect.any(String)
    )
  })

  it('accepts a request with no envelope at all', async () => {
    const fetchImpl = sequence(jsonResponse(token), jsonResponse({ data: {} }))
    const api = new AirtelCollectionApi(collection(), 'https://airtel.test', fetchImpl)

    await expect(api.requestToPay('1000', '068511358', 'ORDER-1')).resolves.toEqual(
      expect.any(String)
    )
  })

  it('raises on a failed status lookup rather than returning a blank transaction', async () => {
    const fetchImpl = sequence(
      jsonResponse(token),
      jsonResponse({
        data: {},
        status: { success: false, message: 'Transaction not found', result_code: 'ESB000004' },
      })
    )
    const api = new AirtelCollectionApi(collection(), 'https://airtel.test', fetchImpl)

    const error = await api.getPaymentStatus('ext-1').catch((e) => e)

    expect(error).toBeInstanceOf(MomoException)
    expect(error.code).toBe('ESB000004')
    expect(error.message).toBe('Transaction not found')
  })
})
