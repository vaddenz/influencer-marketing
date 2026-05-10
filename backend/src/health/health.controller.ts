import { PrismaService } from '@/common/prisma/prisma.service'
import { Controller, Get, Logger } from '@nestjs/common'
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus'
import { ConfigService } from '@nestjs/config'
import { HEALTH_CHECK_PATH } from '@/common/const/app'
import { RedisHealthIndicator } from './redis.indicator'
import { StorageHealthIndicator } from './storage.indicator'

@Controller(HEALTH_CHECK_PATH)
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private redis: RedisHealthIndicator,
    private storage: StorageHealthIndicator,
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  @Get()
  @HealthCheck()
  check() {
    Logger.verbose(
      `Health check configuration: ${JSON.stringify(
        this.configService.get('health-check')
      )}`
    )
    return this.health.check([
      () => this.db.pingCheck('database', this.prisma),
      () => this.redis.isHealthy('redis'),
      () => this.storage.isHealthy('storage'),
      () =>
        this.memory.checkHeap(
          'memory_heap',
          this.configService.get('health-check.maxMemoryUtilization')!
        ),
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: this.configService.get(
            'health-check.maxDiskUsagePercent'
          )!,
        }),
    ])
  }
}
