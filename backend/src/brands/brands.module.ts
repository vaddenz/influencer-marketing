import { Module } from '@nestjs/common'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { BrandsController } from './brands.controller'
import { BrandsService } from './brands.service'

@Module({
  controllers: [BrandsController],
  providers: [BrandsService],
  imports: [PrismaModule],
})
export class BrandsModule {}
