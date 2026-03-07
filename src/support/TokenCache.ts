interface CachedToken {
  value: string
  expiresAt: number
}

export class TokenCache {
  private cache: CachedToken | null = null

  get(): string | null {
    if (!this.cache) return null
    if (Date.now() >= this.cache.expiresAt) {
      this.cache = null
      return null
    }
    return this.cache.value
  }

  set(token: string, expiresIn: number): void {
    this.cache = {
      value: token,
      expiresAt: Date.now() + Math.max(0, expiresIn - 60) * 1000,
    }
  }
}
