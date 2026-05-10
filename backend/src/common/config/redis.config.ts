import { registerAs } from '@nestjs/config'

/**
 * Redis Configuration
 *
 * Registers the 'redis' configuration namespace.
 * Contains settings for connecting to the Redis server.
 */
export default registerAs('redis', () => ({
  /** The full connection URL for Redis (optional) */
  url: process.env.REDIS_URL ?? '',
  /** The Redis host (default: 'localhost') */
  host: process.env.REDIS_HOST ?? 'localhost',
  /** The Redis port (default: 6379) */
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  /** The username for Redis authentication (optional) */
  user: process.env.REDIS_USER,
  /** The password for Redis authentication (optional) */
  password: process.env.REDIS_PASSWORD,
  /** The Redis database index (default: 0) */
  db: parseInt(process.env.REDIS_DB ?? '0', 10),
}))
