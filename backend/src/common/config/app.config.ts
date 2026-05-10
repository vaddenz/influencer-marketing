import { registerAs } from '@nestjs/config'

/**
 * Application Configuration
 *
 * Registers the 'app' configuration namespace.
 * Contains general application settings like port and environment.
 */
export default registerAs('app', () => ({
  /** The port number on which the application listens (default: 3000) */
  port: parseInt(process.env.PORT ?? '3000', 10),
  /** The Node.js environment (e.g., 'development', 'production', 'test') */
  nodeEnv: process.env.NODE_ENV ?? 'development',
  /** The host name or IP address that the application will advertise (default: 'http://localhost') */
  advertisedHost: process.env.ADVERTISED_HOST ?? 'http://localhost',
}))
