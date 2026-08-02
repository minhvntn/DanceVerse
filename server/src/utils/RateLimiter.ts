export class TokenBucket {
  private tokens: number;
  private lastUpdate: number;

  constructor(public maxTokens: number, public fillRatePerSecond: number) {
    this.tokens = maxTokens;
    this.lastUpdate = Date.now();
  }

  public consume(amount: number = 1): boolean {
    this.refill();
    if (this.tokens >= amount) {
      this.tokens -= amount;
      return true;
    }
    return false;
  }

  private refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastUpdate) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsedSeconds * this.fillRatePerSecond);
    this.lastUpdate = now;
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }
}

export class RateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private maxTokens: number, private fillRatePerSecond: number) {
    // Clean up stale buckets every 60 seconds
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.buckets.entries()) {
        // If untouched for 5 minutes, remove it
        if (now - bucket.getLastUpdate() > 300000) {
          this.buckets.delete(key);
        }
      }
    }, 60000);
  }

  public destroy() {
    clearInterval(this.cleanupInterval);
  }

  public tryConsume(key: string, amount: number = 1): boolean {
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = new TokenBucket(this.maxTokens, this.fillRatePerSecond);
      this.buckets.set(key, bucket);
    }
    return bucket.consume(amount);
  }

  public clear(key: string) {
    this.buckets.delete(key);
  }
}
