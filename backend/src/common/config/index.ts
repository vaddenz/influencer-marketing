import appConfig from './app.config'
import databaseConfig from './database.config'
import feishuConfig from './feishu.config'
import healthCheckConfig from './health-check.config'
import httpClientConfig from './http-client.config'
import jwtConfig from './jwt.config'
import llmConfig from './llm.config'
import mqConfig from './mq.config'
import oauthConfig from './oauth.config'
import scraperConfig from './scraper.config'
import redisConfig from './redis.config'
import storageConfig from './storage.config'
import otelConfig from './otel.config'
import vectorSearchConfig from './vector-search.config'

/**
 * Array of all configuration factories.
 * Used to load all configurations into the ConfigModule.
 */
export const configurations = [
  appConfig,
  databaseConfig,
  feishuConfig,
  healthCheckConfig,
  httpClientConfig,
  jwtConfig,
  llmConfig,
  mqConfig,
  oauthConfig,
  redisConfig,
  scraperConfig,
  storageConfig,
  otelConfig,
  vectorSearchConfig,
]

/**
 * Export individual configuration objects for direct access if needed.
 */
export {
  appConfig,
  databaseConfig,
  feishuConfig,
  healthCheckConfig,
  httpClientConfig,
  jwtConfig,
  llmConfig,
  mqConfig,
  oauthConfig,
  redisConfig,
  scraperConfig,
  storageConfig,
  otelConfig,
  vectorSearchConfig,
}
