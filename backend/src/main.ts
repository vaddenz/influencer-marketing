import { NestFactory } from '@nestjs/core'
import { ConsoleLogger, RequestMethod, ValidationPipe } from '@nestjs/common'
import { AppModule } from '@/app.module'
import { AllExceptionsFilter } from '@/common/filters/http-exception.filter'
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor'
import {
  GLOBAL_PREFIX,
  HEALTH_CHECK_PATH,
  FEISHU_WEBHOOK_PATH,
} from '@/common/const/app'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: process.env.NODE_ENV === 'production',
    }),
  })
  app.setGlobalPrefix(GLOBAL_PREFIX)
  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
  })
  app.useGlobalInterceptors(
    new TransformInterceptor([HEALTH_CHECK_PATH, FEISHU_WEBHOOK_PATH])
  )
  app.useGlobalFilters(new AllExceptionsFilter([HEALTH_CHECK_PATH]))
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.enableShutdownHooks()

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
