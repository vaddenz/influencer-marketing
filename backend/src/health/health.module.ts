import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { RedisModule } from '@/common/redis/redis.module'
import { S3Client } from '@/common/clients/s3.client'
import { HealthController } from './health.controller'
import { RedisHealthIndicator } from './redis.indicator'
import { StorageHealthIndicator } from './storage.indicator'

@Module({
  imports: [
    TerminusModule.forRoot({
      gracefulShutdownTimeoutMs: 5 * 1000,
    }),
    RedisModule,
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, S3Client, StorageHealthIndicator],
})
export class HealthModule {}
