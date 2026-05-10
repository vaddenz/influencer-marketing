import { Injectable } from '@nestjs/common'
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus'
import { S3Client } from '@/common/clients/s3.client'

@Injectable()
export class StorageHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly s3Client: S3Client
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key)

    try {
      await this.s3Client.client.listBuckets()
      return indicator.up()
    } catch (error) {
      return indicator.down({ message: error.message })
    }
  }
}
