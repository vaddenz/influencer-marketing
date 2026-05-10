import { Injectable, ExecutionContext } from '@nestjs/common'
import { ThrottlerGuard, seconds } from '@nestjs/throttler'
import { Request } from 'express'

/**
 * Default throttler configuration
 */
export const DEFAULT_THROTTLER = {
  ttl: seconds(1),
  limit: 1000,
}

/**
 * Pre-configured throttler sets
 */
export const THROTTLERS = {
  strict: {
    default: {
      ttl: seconds(60),
      limit: 20,
    },
  },
}

/**
 * Custom Throttler Guard
 *
 * Extends the default ThrottlerGuard to provide custom tracking logic.
 * Attempts to track by User ID (from JWT) first, falling back to IP address.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Determines the tracker string for the current request.
   *
   * @param req - The Express request object
   * @returns A promise resolving to the tracker string (User ID or IP)
   */
  protected async getTracker(req: Request): Promise<string> {
    // Check if user is authenticated via Bearer token
    // We parse the token manually to avoid dependency on AuthGuard execution order
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        // Simple base64 decode of the payload part (2nd part)
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8')
          )
          if (payload && payload.sub) {
            // Use user ID as tracker key
            return `user-${payload.sub}`
          }
        }
      } catch (e) {
        // If token parsing fails, fall back to IP
      }
    }

    // Fallback to IP address
    return req.ips.length ? req.ips[0] : (req.ip ?? '127.0.0.1')
  }
}
