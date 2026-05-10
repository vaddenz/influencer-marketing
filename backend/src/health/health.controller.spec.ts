import { Test, TestingModule } from '@nestjs/testing'
import { HealthController } from './health.controller'
import {
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '@/common/prisma/prisma.service'
import { RedisHealthIndicator } from './redis.indicator'
import { StorageHealthIndicator } from './storage.indicator'

describe('HealthController', () => {
  let controller: HealthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(),
          },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: {
            pingCheck: jest.fn(),
          },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: jest.fn(),
          },
        },
        {
          provide: DiskHealthIndicator,
          useValue: {
            checkStorage: jest.fn(),
          },
        },
        {
          provide: RedisHealthIndicator,
          useValue: {
            isHealthy: jest.fn(),
          },
        },
        {
          provide: StorageHealthIndicator,
          useValue: {
            isHealthy: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<HealthController>(HealthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
