import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class AdminRateLimiter {
  private store: RateLimitStore = {};
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs; // 1 minute window
    this.maxRequests = maxRequests; // Max 100 requests per minute for admins
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    this.cleanupExpiredEntries();
    
    const now = Date.now();
    const entry = this.store[identifier];

    if (!entry || entry.resetTime <= now) {
      // First request or window expired, create new entry
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: this.store[identifier].resetTime
      };
    }

    // Increment count
    entry.count++;

    const allowed = entry.count <= this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - entry.count);

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime
    };
  }

  getHeaders(result: { allowed: boolean; remaining: number; resetTime: number }) {
    return {
      'X-RateLimit-Limit': this.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    };
  }
}

// Create singleton instance
export const adminRateLimiter = new AdminRateLimiter();

export async function checkAdminRateLimit(
  request: NextRequest,
  adminEmail: string
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  // Use admin email as identifier
  const identifier = `admin:${adminEmail}`;
  
  const result = await adminRateLimiter.checkLimit(identifier);
  const headers = adminRateLimiter.getHeaders(result);

  return {
    allowed: result.allowed,
    headers
  };
}
