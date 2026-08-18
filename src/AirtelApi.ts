import { AirtelConfig, AirtelConfigOptions } from './models/AirtelConfig.js'
import { AirtelCollectionApi } from './products/AirtelCollectionApi.js'
import { AirtelDisbursementApi } from './products/AirtelDisbursementApi.js'
import { FetchLike } from './support/http.js'

export const AIRTEL_ENVIRONMENT_PRODUCTION = 'production'
export const AIRTEL_ENVIRONMENT_STAGING = 'staging'

export const AIRTEL_PRODUCTION_URL = 'https://openapi.airtel.cg'
export const AIRTEL_STAGING_URL = 'https://openapiuat.airtel.cg'

export class AirtelApi {
  private readonly baseUrl: string
  private readonly fetchImpl: FetchLike | undefined

  private constructor(mode: string, fetchImpl?: FetchLike) {
    this.baseUrl =
      mode === AIRTEL_ENVIRONMENT_PRODUCTION ? AIRTEL_PRODUCTION_URL : AIRTEL_STAGING_URL
    this.fetchImpl = fetchImpl
  }

  static create(
    mode: string = AIRTEL_ENVIRONMENT_STAGING,
    fetchImpl?: FetchLike
  ): AirtelApi {
    return new AirtelApi(mode, fetchImpl)
  }

  getCollection(config: AirtelConfig): AirtelCollectionApi {
    return new AirtelCollectionApi(config, this.baseUrl, this.fetchImpl)
  }

  getDisbursement(config: AirtelConfig): AirtelDisbursementApi {
    return new AirtelDisbursementApi(config, this.baseUrl, this.fetchImpl)
  }

  /**
   * Shorthand factory for the Airtel Collection API.
   *
   * ```ts
   * const collection = AirtelApi.collection('staging', {
   *   clientId: 'YOUR_CLIENT_ID',
   *   clientSecret: 'YOUR_CLIENT_SECRET',
   * })
   * const externalId = await collection.requestToPay('5000', '068511358', 'ORDER-001')
   * ```
   */
  static collection(
    mode: string,
    options: AirtelConfigOptions,
    fetchImpl?: FetchLike
  ): AirtelCollectionApi {
    return AirtelApi.create(mode, fetchImpl).getCollection(new AirtelConfig(options))
  }

  /**
   * Shorthand factory for the Airtel Disbursement API.
   *
   * ```ts
   * const disbursement = AirtelApi.disbursement('staging', {
   *   clientId: 'YOUR_CLIENT_ID',
   *   clientSecret: 'YOUR_CLIENT_SECRET',
   *   encryptedPin: 'YOUR_ENCRYPTED_PIN',
   * })
   * const externalId = await disbursement.transfer('10000', '068511358', 'PAY-001')
   * ```
   */
  static disbursement(
    mode: string,
    options: AirtelConfigOptions,
    fetchImpl?: FetchLike
  ): AirtelDisbursementApi {
    return AirtelApi.create(mode, fetchImpl).getDisbursement(new AirtelConfig(options))
  }
}
