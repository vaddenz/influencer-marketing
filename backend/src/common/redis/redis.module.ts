import { Logger, Module, OnModuleDestroy } from '@nestjs/common'
import { createClient } from '@redis/client'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { RedisService } from './redis.service'

/**
 * Helper function to construct Redis connection options from configuration.
 *
 * @param configService - The configuration service
 * @returns An object containing the Redis URL
 */
const getRedisOptions = (configService: ConfigService) => {
  const url = configService.get('redis.url') || ''
  const host = configService.get('redis.host') || '127.0.0.1'
  const port = configService.get('redis.port') || 6379
  const database = configService.get('redis.db') || 0
  const password = configService.get('redis.password') || ''
  const user = configService.get('redis.user') || ''
  return {
    url: url || `redis://${user}:${password}@${host}:${port}/${database}`,
  }
}

/**
 * Redis Module
 *
 * Provides the Redis client and service to the application.
 * Manages the connection lifecycle (connect/disconnect).
 */
@Module({
  imports: [ConfigModule], // Import configuration module to get Redis connection info
  providers: [
    {
      provide: 'REDIS_CLIENT', // Injection token
      useFactory: async (configService: ConfigService) => {
        // Connect to Redis as we start
        const redisOptions = getRedisOptions(configService)
        const client = createClient(redisOptions)
        try {
          await client.connect()
          client.on('error', (err) => {
            Logger.error('Redis client error:', err)
          })

          return client
        } catch (error) {
          Logger.error(`Redis connection failed: ${error}`)
          throw error
        }
      },
      inject: [ConfigService], // Inject configuration service
    },
    RedisService, // Provide Redis service
  ],
  exports: ['REDIS_CLIENT', RedisService], // Export service for use by other modules
})
export class RedisModule implements OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Cleanup hook called when the module is destroyed.
   * Ensures the Redis connection is closed gracefully.
   */
  async onModuleDestroy() {
    const client = createClient(getRedisOptions(this.configService))
    if (client.isOpen) {
      await client.quit()
    }
  }
}
