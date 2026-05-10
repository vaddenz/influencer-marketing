import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { UserService } from '@/user/user.service'
import { AuthModule } from '@/common/auth/auth.module'
import { UserAuthController } from '@/user/user-auth.controller'
import { UserController } from '@/user/user.controller'
import { ListUsersCommand } from '@/user/commands/list-users.command'

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  controllers: [UserAuthController, UserController],
  providers: [UserService, ListUsersCommand],
  exports: [UserService],
})
export class UserModule {}
