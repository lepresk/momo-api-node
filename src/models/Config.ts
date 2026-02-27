export interface ConfigOptions {
  subscriptionKey: string
  apiUser: string
  apiKey: string
  callbackUri: string
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
    this.callbackUri = options.callbackUri
  }

  static sandbox(subscriptionKey: string): Config {
    return new Config({
      subscriptionKey,
      apiUser: '',
      apiKey: '',
      callbackUri: '',
    })
  }

  static collection(
    subscriptionKey: string,
    apiUser: string,
    apiKey: string,
    callbackUri: string
  ): Config {
    return new Config({ subscriptionKey, apiUser, apiKey, callbackUri })
  }

  static disbursement(
    subscriptionKey: string,
    apiUser: string,
    apiKey: string,
    callbackUri: string
  ): Config {
    return new Config({ subscriptionKey, apiUser, apiKey, callbackUri })
  }
}

export type CollectionConfig = Config
export type DisbursementConfig = Config
