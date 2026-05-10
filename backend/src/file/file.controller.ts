import {
  Controller,
  Post,
  Get,
  Head,
  Delete,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpStatus,
  HttpException,
  StreamableFile,
  Headers,
} from '@nestjs/common'
import type { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { Throttle } from '@nestjs/throttler'
import { THROTTLERS } from '@/common/guards/custom-throttler.guard'
import { FileService } from './file.service'
import { UploadFileResultDto } from './dto/upload-file.dto'
import { FileUploadMetricsInterceptor } from '@/common/otel/interceptors/file-upload-metrics.interceptor'

@Controller(`files`)
export class FileAPIController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'), FileUploadMetricsInterceptor)
  async uploadFile(
    @Req() req,
    @UploadedFile() file: Express.Multer.File
  ): Promise<UploadFileResultDto> {
    return this.fileService.uploadFile(req.user.id, file)
  }

  // @Get(':key/exists')
  // @UseGuards(JwtAuthGuard)
  // async checkFileExists(
  //   @CurrentUser() user: UserPayload,
  //   @Param('key') key: string
  // ): Promise<FileExistsDto> {
  //   return this.fileService.checkFileExists(user.id, key)
  // }

  // @Delete(':key')
  // @UseGuards(JwtAuthGuard)
  // async deleteFile(
  //   @CurrentUser() user: UserPayload,
  //   @Param('key') key: string
  // ): Promise<FileDeleteResultDto> {
  //   return this.fileService.deleteFile(user.id, key)
  // }
}

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('*path')
  @Throttle(THROTTLERS.strict)
  async downloadFile(
    @Param('path') path: string | string[],
    @Res() res: Response
  ): Promise<void> {
    const key = Array.isArray(path) ? path.join('/') : path
    try {
      const result = await this.fileService.downloadFile('anonymous', key)

      // Set appropriate headers for file download
      res.setHeader('Content-Type', result.metadata.contentType)
      res.setHeader('Content-Length', result.metadata.size)
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.metadata.name}"`
      )
      res.setHeader(
        'Last-Modified',
        result.metadata.lastModified?.toUTCString() || new Date().toUTCString()
      )

      // Send the file buffer
      res.send(result.buffer)
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Failed to download file',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Head('*path')
  async getFileMetadata(
    @Param('path') path: string | string[],
    @Res() res: Response
  ): Promise<void> {
    const key = Array.isArray(path) ? path.join('/') : path
    try {
      const metadata = await this.fileService.getFileMetadata('anonymous', key)

      // Set appropriate headers for HEAD request
      res.setHeader('Content-Type', metadata.contentType)
      res.setHeader('Content-Length', metadata.size)
      res.setHeader(
        'Last-Modified',
        metadata.lastModified?.toUTCString() || new Date().toUTCString()
      )
      if (metadata.etag) {
        res.setHeader('ETag', metadata.etag)
      }

      res.status(HttpStatus.OK).send()
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Failed to get file metadata',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
