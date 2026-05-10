import { Module } from '@nestjs/common'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { InvitationsController } from './invitations.controller'
import { InvitationsService } from './invitations.service'

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService],
  imports: [PrismaModule],
})
export class InvitationsModule {}
