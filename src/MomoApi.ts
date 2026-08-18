import { Config, CollectionConfig, DisbursementConfig } from './models/Config.js'
import { CollectionApi } from './products/CollectionApi.js'
import { DisbursementApi } from './products/DisbursementApi.js'
import { SandboxApi } from './products/SandboxApi.js'
import { FetchLike } from './support/http.js'

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

/** Every environment the client accepts: sandbox plus the 11 production markets. */
export const MTN_ENVIRONMENTS = [
  ENVIRONMENT_SANDBOX,
  ENVIRONMENT_MTN_CONGO,
  ENVIRONMENT_MTN_UGANDA,
  ENVIRONMENT_MTN_GHANA,
  ENVIRONMENT_IVORY_COAST,
  ENVIRONMENT_ZAMBIA,
  ENVIRONMENT_CAMEROON,
  ENVIRONMENT_BENIN,
  ENVIRONMENT_SWAZILAND,
  ENVIRONMENT_GUINEACONAKRY,
  ENVIRONMENT_SOUTHAFRICA,
  ENVIRONMENT_LIBERIA,
] as const

/** Flat credentials accepted by `MomoApi.collection()` and `MomoApi.disbursement()`. */
export interface MomoApiOptions {
  environment?: string
  subscriptionKey: string
  apiUser: string
  apiKey: string
  callbackUrl?: string
  /** Custom `fetch` implementation for timeouts, retries, proxying or tests. */
  fetchImpl?: FetchLike
}

function requireField(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

function toConfig(options: MomoApiOptions): Config {
  return Config.collection(
    requireField(options.subscriptionKey, 'subscriptionKey'),
    requireField(options.apiUser, 'apiUser'),
    requireField(options.apiKey, 'apiKey'),
    options.callbackUrl ?? ''
  )
}

export class MomoApi {
  private readonly environment: string
  private readonly baseUrl: string
  private readonly fetchImpl: FetchLike | undefined

  private constructor(environment: string, fetchImpl?: FetchLike) {
    this.environment = environment
    this.baseUrl = MomoApi.getBaseUrl(environment)
    this.fetchImpl = fetchImpl
  }

  /**
   * Resolve the API host for an environment.
   *
   * @throws Error when the environment is not one of {@link MTN_ENVIRONMENTS}
   */
  static getBaseUrl(environment: string): string {
    if (environment === ENVIRONMENT_SANDBOX) {
      return SANDBOX_URL
    }
    if (!(MTN_ENVIRONMENTS as readonly string[]).includes(environment)) {
      throw new Error(`Unknown environment: '${environment}'`)
    }
    return PRODUCTION_URL
  }

  static create(environment: string, fetchImpl?: FetchLike): MomoApi {
    return new MomoApi(environment, fetchImpl)
  }

  /**
   * Build a Collection client from flat credentials.
   *
   * ```ts
   * const collection = MomoApi.collection({
   *   environment: ENVIRONMENT_MTN_CONGO,
   *   subscriptionKey: '...',
   *   apiUser: '...',
   *   apiKey: '...',
   *   callbackUrl: 'https://example.com/hook',
   * })
   * ```
   *
   * Pass `fetchImpl` to route the client's traffic through your own `fetch`.
   */
  /**
   * Normalize either accepted shape into a config plus a validated environment.
   */
  private static resolve(
    source: MomoApiOptions | Config,
    environment: string
  ): {
    config: Config
    environment: string
    baseUrl: string
    fetchImpl: FetchLike | undefined
  } {
    const target = source instanceof Config
      ? environment
      : source.environment ?? ENVIRONMENT_SANDBOX
    return {
      config: source instanceof Config ? source : toConfig(source),
      environment: target,
      baseUrl: MomoApi.getBaseUrl(target),
      fetchImpl: source instanceof Config ? undefined : source.fetchImpl,
    }
  }

  /**
   * Build a Collection client from flat credentials.
   *
   * ```ts
   * const collection = MomoApi.collection({
   *   environment: ENVIRONMENT_MTN_CONGO,
   *   subscriptionKey: '...',
   *   apiUser: '...',
   *   apiKey: '...',
   *   callbackUrl: 'https://example.com/hook',
   * })
   * ```
   */
  static collection(options: MomoApiOptions): CollectionApi
  static collection(config: CollectionConfig, environment?: string): CollectionApi
  static collection(
    source: MomoApiOptions | CollectionConfig,
    environment: string = ENVIRONMENT_SANDBOX
  ): CollectionApi {
    const target = MomoApi.resolve(source, environment)
    return new CollectionApi(
      target.config,
      target.baseUrl,
      target.environment,
      target.fetchImpl
    )
  }

  /**
   * Build a Disbursement client from flat credentials.
   *
   * @see {@link MomoApi.collection}
   */
  static disbursement(options: MomoApiOptions): DisbursementApi
  static disbursement(config: DisbursementConfig, environment?: string): DisbursementApi
  static disbursement(
    source: MomoApiOptions | DisbursementConfig,
    environment: string = ENVIRONMENT_SANDBOX
  ): DisbursementApi {
    const target = MomoApi.resolve(source, environment)
    return new DisbursementApi(
      target.config,
      target.baseUrl,
      target.environment,
      target.fetchImpl
    )
  }

  getEnvironment(): string {
    return this.environment
  }

  /**
   * Access the sandbox provisioning endpoints.
   *
   * @throws Error when this client is not bound to the sandbox environment
   */
  sandbox(subscriptionKey: string): SandboxApi {
    if (this.environment !== ENVIRONMENT_SANDBOX) {
      throw new Error(`Environment must be ${ENVIRONMENT_SANDBOX}`)
    }
    return new SandboxApi(subscriptionKey, this.baseUrl, this.fetchImpl)
  }

  getCollection(config: CollectionConfig): CollectionApi {
    return new CollectionApi(config, this.baseUrl, this.environment, this.fetchImpl)
  }

  getDisbursement(config: DisbursementConfig): DisbursementApi {
    return new DisbursementApi(config, this.baseUrl, this.environment, this.fetchImpl)
  }
}
