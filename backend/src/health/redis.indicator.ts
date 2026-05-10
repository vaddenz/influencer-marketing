import { Inject, Injectable } from '@nestjs/common'
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus'
import type { RedisClientType } from '@redis/client'

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: RedisClientType
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key)

    try {
      await this.redisClient.ping()
      return indicator.up()
    } catch (error) {
      return indicator.down({ message: error.message })
    }
  }
}
