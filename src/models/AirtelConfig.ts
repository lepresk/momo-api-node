export interface AirtelConfigOptions {
  /** OAuth2 client_id credential from the Airtel developer portal */
  clientId: string
  /** OAuth2 client_secret credential from the Airtel developer portal */
  clientSecret: string
  /** Pre-encrypted PIN required for disbursement operations */
  encryptedPin?: string
  /** ISO country code — defaults to 'CG' (Congo) */
  country?: string
  /** ISO currency code — defaults to 'XAF' */
  currency?: string
  /** Webhook URL for async payment notifications */
  callbackUri?: string
}

export class AirtelConfig {
  readonly clientId: string
  readonly clientSecret: string
  readonly encryptedPin: string
  readonly country: string
  readonly currency: string
  readonly callbackUri: string

  constructor(options: AirtelConfigOptions) {
    this.clientId = options.clientId
    this.clientSecret = options.clientSecret
    this.encryptedPin = options.encryptedPin ?? ''
    this.country = options.country ?? 'CG'
    this.currency = options.currency ?? 'XAF'
    this.callbackUri = options.callbackUri ?? ''
  }

  static collection(
    clientId: string,
    clientSecret: string,
    callbackUri?: string,
    country?: string,
    currency?: string,
  ): AirtelConfig {
    return new AirtelConfig({ clientId, clientSecret, callbackUri, country, currency })
  }

  static disbursement(
    clientId: string,
    clientSecret: string,
    encryptedPin: string,
    callbackUri?: string,
    country?: string,
    currency?: string,
  ): AirtelConfig {
    return new AirtelConfig({ clientId, clientSecret, encryptedPin, callbackUri, country, currency })
  }
}
