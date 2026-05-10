import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client } from '@/common/clients/s3.client'
import { HashUtil, FileUtil } from '@/common/utils'
import {
  FileMetadataDto,
  FileDownloadDto,
  FileExistsDto,
  FileDeleteResultDto,
} from './dto/file-metadata.dto'

export interface FileUploadResult {
  bucket: string // The business bucket name (may not be a real bucket name)
  key: string
  url: string
  name: string
  hash: string
  size: number
  contentType: string
}

@Injectable()
export class FileService {
  private readonly bucketName: string
  private readonly logger = new Logger(FileService.name)

  constructor(
    private readonly s3Client: S3Client,
    private readonly configService: ConfigService
  ) {
    this.bucketName =
      this.configService.get('storage.defaultBucket') || 'default'
  }

  /**
   * Upload file to S3
   * @param userId - The user ID
   * @param file - The file to upload
   * @returns FileUploadResult with bucket, key, and URL
   */
  async uploadFile(
    userId: string,
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    const name = FileUtil.fixUtf8FileName(file.originalname)
    const size = file.size
    const contentType = file.mimetype
    // Calculate SHA1 hash of file content using HashUtil
    const hash = HashUtil.sha1(file.buffer.toString('base64'))
    this.logger.log(`Processing file upload`, {
      userId,
      hash,
      name,
      size,
      contentType,
    })

    // Upload file using S3Client's uploadBuffer method
    const result = await this.s3Client.uploadFormFile(this.bucketName, file, {
      directory: `${userId}`,
    })

    const url = await this.s3Client.getUrl(this.bucketName, result.key)

    return {
      bucket: this.bucketName,
      key: result.key,
      url,
      name,
      hash,
      size: result.size,
      contentType,
    }
  }

  /**
   * Download file from S3
   * @param userId - The user ID
   * @param key - The file key
   * @returns FileDownloadDto with buffer and metadata
   */
  async downloadFile(userId: string, key: string): Promise<FileDownloadDto> {
    this.logger.log(`Processing file download`, { userId, key })

    // Check if file exists
    const exists = await this.s3Client.isFileExists(this.bucketName, key)
    if (!exists) {
      throw new NotFoundException(`File not found: ${key}`)
    }

    // Get file metadata first
    const metadata = await this.getFileMetadata(userId, key)

    // Download file buffer
    const buffer = await this.s3Client.getFile(this.bucketName, key)

    return {
      buffer,
      metadata,
    }
  }

  /**
   * Get file metadata
   * @param userId - The user ID
   * @param key - The file key
   * @returns FileMetadataDto
   */
  async getFileMetadata(userId: string, key: string): Promise<FileMetadataDto> {
    this.logger.log(`Getting file metadata`, { userId, key })

    try {
      const stat = await this.s3Client.client.statObject(
        this.s3Client.getActualBucket(this.bucketName),
        key
      )

      return {
        bucket: this.bucketName,
        key,
        name: key.split('/').pop() || key,
        size: stat.size,
        contentType:
          stat.metaData['content-type'] || 'application/octet-stream',
        lastModified: stat.lastModified,
        etag: stat.etag,
      }
    } catch (error) {
      this.logger.error(`Failed to get file metadata: ${error.message}`)
      throw new NotFoundException(`File not found: ${key}`)
    }
  }

  /**
   * Check if file exists
   * @param userId - The user ID
   * @param key - The file key
   * @returns FileExistsDto
   */
  async checkFileExists(userId: string, key: string): Promise<FileExistsDto> {
    this.logger.log(`Checking file existence`, { userId, key })

    const exists = await this.s3Client.isFileExists(this.bucketName, key)

    return {
      exists,
      key,
    }
  }

  /**
   * Delete file from S3
   * @param userId - The user ID
   * @param key - The file key
   * @returns FileDeleteResultDto
   */
  async deleteFile(userId: string, key: string): Promise<FileDeleteResultDto> {
    this.logger.log(`Processing file deletion`, { userId, key })

    // Check if file exists first
    const exists = await this.s3Client.isFileExists(this.bucketName, key)
    if (!exists) {
      return {
        success: false,
        key,
        message: 'File not found',
      }
    }

    try {
      await this.s3Client.client.removeObject(
        this.s3Client.getActualBucket(this.bucketName),
        key
      )

      return {
        success: true,
        key,
        message: 'File deleted successfully',
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`)
      return {
        success: false,
        key,
        message: `Failed to delete file: ${error.message}`,
      }
    }
  }
}
