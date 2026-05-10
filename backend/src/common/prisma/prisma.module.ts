import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/**
 * Prisma Module
 *
 * Global module that provides the PrismaService to the entire application.
 * Being @Global(), it doesn't need to be imported in other modules.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
