import { Module } from '@nestjs/common'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { DeliverablesController } from './deliverables.controller'
import { DeliverablesService } from './deliverables.service'

@Module({
  controllers: [DeliverablesController],
  providers: [DeliverablesService],
  imports: [PrismaModule],
})
export class DeliverablesModule {}
