import { Module } from '@nestjs/common'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { InfluencersController } from './influencers.controller'
import { InfluencersService } from './influencers.service'

@Module({
  controllers: [InfluencersController],
  providers: [InfluencersService],
  imports: [PrismaModule],
})
export class InfluencersModule {}
