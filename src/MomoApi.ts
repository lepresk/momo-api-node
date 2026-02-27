import { Config, CollectionConfig, DisbursementConfig } from './models/Config.js'
import { CollectionApi } from './products/CollectionApi.js'
import { DisbursementApi } from './products/DisbursementApi.js'
import { SandboxApi } from './products/SandboxApi.js'

export const ENVIRONMENT_MTN_CONGO = 'mtncongo'
export const ENVIRONMENT_MTN_UGANDA = 'mtnuganda'
export const ENVIRONMENT_MTN_GHANA = 'mtnghana'
export const ENVIRONMENT_IVORY_COAST = 'mtnivorycoast'
export const ENVIRONMENT_ZAMBIA = 'mtnzambia'
export const ENVIRONMENT_CAMEROON = 'mtncameroon'
export const ENVIRONMENT_BENIN = 'mtnbenin'
export const ENVIRONMENT_SWAZILAND = 'mtnswaziland'
export const ENVIRONMENT_GUINEACONAKRY = 'mtnguineaconakry'
export const ENVIRONMENT_SOUTHAFRICA = 'mtnsouthafrica'
export const ENVIRONMENT_LIBERIA = 'mtnliberia'
export const ENVIRONMENT_SANDBOX = 'sandbox'

export const SANDBOX_URL = 'https://sandbox.momodeveloper.mtn.com'
export const PRODUCTION_URL = 'https://proxy.momoapi.mtn.com'

export class MomoApi {
  private readonly environment: string
  private readonly baseUrl: string

  private constructor(environment: string) {
    this.environment = environment
    this.baseUrl =
      environment === ENVIRONMENT_SANDBOX ? SANDBOX_URL : PRODUCTION_URL
  }

  static create(environment: string): MomoApi {
    return new MomoApi(environment)
  }

  static collection(config: CollectionConfig): CollectionApi {
    const environment = ENVIRONMENT_SANDBOX
    const baseUrl = SANDBOX_URL
    return new CollectionApi(config, baseUrl, environment)
  }

  static disbursement(config: DisbursementConfig): DisbursementApi {
    const environment = ENVIRONMENT_SANDBOX
    const baseUrl = SANDBOX_URL
    return new DisbursementApi(config, baseUrl, environment)
  }

  sandbox(subscriptionKey: string): SandboxApi {
    return new SandboxApi(subscriptionKey, this.baseUrl)
  }

  getCollection(config: CollectionConfig): CollectionApi {
    return new CollectionApi(config, this.baseUrl, this.environment)
  }

  getDisbursement(config: DisbursementConfig): DisbursementApi {
    return new DisbursementApi(config, this.baseUrl, this.environment)
  }
}
