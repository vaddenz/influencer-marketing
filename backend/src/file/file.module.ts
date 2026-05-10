import { Module } from '@nestjs/common'
import { FileAPIController, FileController } from './file.controller'
import { FileService } from './file.service'
import { S3Client } from '@/common/clients/s3.client'
import { AuthModule } from '@/common/auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [FileAPIController, FileController],
  providers: [FileService, S3Client],
  exports: [FileService],
})
export class FileModule {}
