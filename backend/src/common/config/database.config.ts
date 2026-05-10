import { registerAs } from '@nestjs/config'

/**
 * Database Configuration
 *
 * Registers the 'database' configuration namespace.
 * Contains database connection settings.
 */
export default registerAs('database', () => ({
  /** The connection URL for the database */
  url: process.env.DATABASE_URL ?? '',
}))
