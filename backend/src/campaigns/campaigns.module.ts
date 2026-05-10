import { Module } from '@nestjs/common'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { CampaignsController } from './campaigns.controller'
import { CampaignsService } from './campaigns.service'

@Module({
  controllers: [CampaignsController],
  providers: [CampaignsService],
  imports: [PrismaModule],
})
export class CampaignsModule {}
