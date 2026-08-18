export interface ConfigOptions {
  subscriptionKey: string
  apiUser: string
  apiKey: string
  callbackUri?: string
}

export class Config {
  readonly subscriptionKey: string
  readonly apiUser: string
  readonly apiKey: string
  readonly callbackUri: string

  constructor(options: ConfigOptions) {
    this.subscriptionKey = options.subscriptionKey
    this.apiUser = options.apiUser
    this.apiKey = options.apiKey
    this.callbackUri = options.callbackUri ?? ''
  }

  /** Sandbox provisioning needs only the subscription key. */
  static sandbox(subscriptionKey: string): Config {
    return new Config({ subscriptionKey, apiUser: '', apiKey: '' })
  }

  /** Credentials for the Collection product. */
  static collection(
    subscriptionKey: string,
    apiUser: string,
    apiKey: string,
    callbackUri: string = ''
  ): Config {
    return new Config({ subscriptionKey, apiUser, apiKey, callbackUri })
  }

  /** Credentials for the Disbursement product — same shape as {@link collection}. */
  static disbursement(
    subscriptionKey: string,
    apiUser: string,
    apiKey: string,
    callbackUri: string = ''
  ): Config {
    return Config.collection(subscriptionKey, apiUser, apiKey, callbackUri)
  }

  /** Returns a copy of this config with a different callback uri. */
  withCallbackUri(callbackUri: string): Config {
    return new Config({ ...this, callbackUri })
  }
}

export type CollectionConfig = Config
export type DisbursementConfig = Config
