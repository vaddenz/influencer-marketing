import { Module } from '@nestjs/common'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { FeishuController } from './feishu.controller'
import { FeishuService } from './feishu.service'
import { FeishuCommandService } from './feishu-command.service'
import { FeishuSchedulerService } from './feishu-scheduler.service'

@Module({
  controllers: [FeishuController],
  providers: [FeishuService, FeishuCommandService, FeishuSchedulerService],
  imports: [PrismaModule],
  exports: [FeishuService],
})
export class FeishuModule {}
