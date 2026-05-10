import * as winston from 'winston'
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston'
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis'
import { CacheModule } from '@nestjs/cache-manager'
import { BullModule } from '@nestjs/bullmq'
import KeyvRedis, { Keyv } from '@keyv/redis'

import { AuthModule } from '@/common/auth/auth.module'
import { configurations } from '@/common/config'
import {
  CustomThrottlerGuard,
  DEFAULT_THROTTLER,
} from '@/common/guards/custom-throttler.guard'
import { RequestIdMiddleware } from '@/common/middlewares/request-id.middleware'
import { RedisModule } from '@/common/redis/redis.module'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { OtelModule } from '@/common/otel/otel.module'
import { OtelMetricsInterceptor } from '@/common/otel/otel.metrics.interceptor'
import { MQDefaultJobOption } from '@/common/config/mq.config'

import { UserModule } from '@/user/user.module'
import { HealthModule } from '@/health/health.module'
import { FileModule } from '@/file/file.module'
import { BrandsModule } from '@/brands/brands.module'
import { InfluencersModule } from '@/influencers/influencers.module'
import { CampaignsModule } from '@/campaigns/campaigns.module'
import { InvitationsModule } from '@/invitations/invitations.module'
import { DeliverablesModule } from '@/deliverables/deliverables.module'
import { NotificationsModule } from '@/notifications/notifications.module'

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('NestApp', {
              colors: true,
              prettyPrint: true,
            })
          ),
        }),
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: configurations,
    }),
    OtelModule,
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [DEFAULT_THROTTLER],
        storage: new ThrottlerStorageRedisService({
          host: config.get('redis.host'),
          port: config.get('redis.port'),
          password: config.get('redis.password'),
          db: config.get('redis.db'),
        }),
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [RedisModule],
      inject: ['REDIS_CLIENT', ConfigService],
      useFactory: async (client: any, configService: ConfigService) => {
        return {
          stores: [
            new Keyv({
              store: new KeyvRedis(client),
              namespace: configService.get('app.nodeEnv'),
              useKeyPrefix: false,
              stats: true,
              ttl: 60 * 60 * 1000,
            }),
          ],
        }
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: configService.get('mq')!,
        defaultJobOptions: MQDefaultJobOption,
      }),
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    HealthModule,
    FileModule,
    BrandsModule,
    InfluencersModule,
    CampaignsModule,
    InvitationsModule,
    DeliverablesModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: OtelMetricsInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*path')
  }
}
