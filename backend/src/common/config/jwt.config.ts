import { registerAs } from '@nestjs/config'

/**
 * JWT Configuration
 *
 * Registers the 'jwt' configuration namespace.
 * Contains settings for JSON Web Token signing and verification.
 */
export default registerAs('jwt', () => ({
  /** Secret key for signing access tokens */
  secret: process.env.JWT_SECRET ?? 'your-secret-key',
  /** Expiration time for access tokens (e.g., '1h', '1d') */
  expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  /** Secret key for signing refresh tokens */
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'your-refresh-secret',
  /** Expiration time for refresh tokens */
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}))
