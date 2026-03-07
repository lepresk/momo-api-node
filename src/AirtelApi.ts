import { AirtelConfig, AirtelConfigOptions } from './models/AirtelConfig.js'
import { AirtelCollectionApi } from './products/AirtelCollectionApi.js'
import { AirtelDisbursementApi } from './products/AirtelDisbursementApi.js'

export const AIRTEL_ENVIRONMENT_PRODUCTION = 'production'
export const AIRTEL_ENVIRONMENT_STAGING = 'staging'

export const AIRTEL_PRODUCTION_URL = 'https://openapi.airtel.cg'
export const AIRTEL_STAGING_URL = 'https://openapiuat.airtel.cg'

export class AirtelApi {
  private readonly baseUrl: string

  private constructor(mode: string) {
    this.baseUrl =
      mode === AIRTEL_ENVIRONMENT_PRODUCTION ? AIRTEL_PRODUCTION_URL : AIRTEL_STAGING_URL
  }

  static create(mode: string = AIRTEL_ENVIRONMENT_STAGING): AirtelApi {
    return new AirtelApi(mode)
  }

  getCollection(config: AirtelConfig): AirtelCollectionApi {
    return new AirtelCollectionApi(config, this.baseUrl)
  }

  getDisbursement(config: AirtelConfig): AirtelDisbursementApi {
    return new AirtelDisbursementApi(config, this.baseUrl)
  }

  static collection(mode: string, options: AirtelConfigOptions): AirtelCollectionApi {
    return AirtelApi.create(mode).getCollection(new AirtelConfig(options))
  }

  static disbursement(mode: string, options: AirtelConfigOptions): AirtelDisbursementApi {
    return AirtelApi.create(mode).getDisbursement(new AirtelConfig(options))
  }
}
