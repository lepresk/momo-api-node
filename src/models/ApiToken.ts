export interface ApiTokenData {
  access_token: string
  token_type: string
  expires_in: number
}

export class ApiToken {
  private readonly accessToken: string
  private readonly tokenType: string
  private readonly expiresIn: number

  private constructor(accessToken: string, tokenType: string, expiresIn: number) {
    this.accessToken = accessToken
    this.tokenType = tokenType
    this.expiresIn = expiresIn
  }

  static fromObject(data: Record<string, unknown>): ApiToken {
    return new ApiToken(
      data['access_token'] as string,
      data['token_type'] as string,
      data['expires_in'] as number
    )
  }

  getAccessToken(): string {
    return this.accessToken
  }

  getTokenType(): string {
    return this.tokenType
  }

  getExpiresIn(): number {
    return this.expiresIn
  }
}
