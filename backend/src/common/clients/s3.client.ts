import path from 'path'
import * as Minio from 'minio'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import { createId } from '@paralleldrive/cuid2'
import { ErrorUtil, FileUtil } from '@/common/utils'
import { BaseHTTPClient } from './http.client'
import { Readable } from 'stream'

export interface UploadOptions {
  directory?: string // Optional sub folder in bucket
  generateRandomFilename?: boolean // Optional, whether to generate random filename (<random id>.<suffix>), default to false
  filename?: string // Optional filename, default to <random id>.<suffix> if generateRandomFilename is true
  contentType?: string // Optional content type, default to 'application/octet-stream'
}

export interface UploadResult {
  key: string // Unique object key in S3 bucket
  name: string // Actual filename stored in S3
  size: number // File size in bytes
  contentType: string // MIME type of the file
}

/**
 * S3 Client Service
 *
 * Provides a wrapper around MinIO/S3 client for file storage operations.
 * Supports uploading various types of content (Form files, Text, Buffers, URLs) and retrieving files.
 * Handles bucket management and configuration automatically.
 */
@Injectable()
export class S3Client {
  protected logger = new Logger(S3Client.name)
  private readonly _client: Minio.Client
  private readonly http: BaseHTTPClient
  private readonly buckets: Record<string, string>
  private readonly defaultBucket: string

  /**
   * Initialize S3 Client
   * @param configService - NestJS ConfigService for storage configuration
   */
  constructor(private readonly configService: ConfigService) {
    this._client = new Minio.Client({
      endPoint: this.configService.get('storage.endpoint')!,
      port: this.configService.get<number>('storage.port')!,
      useSSL: this.configService.get<boolean>('storage.useSsl')!,
      accessKey: this.configService.get('storage.accessKey')!,
      secretKey: this.configService.get('storage.secretKey')!,
      region: this.configService.get('storage.region')!,
    })
    this.http = new BaseHTTPClient(configService)
    this.defaultBucket = this.configService.get('storage.defaultBucket')!
    this.buckets = this.configService.get('storage.buckets')!

    this.ensureBucketExists()
  }

  /**
   * Get the underlying MinIO client instance
   * @returns MinIO Client instance
   */
  public get client(): Minio.Client {
    return this._client
  }

  /**
   * Get the actual bucket name from configuration mapping
   * @param name - Logical bucket name (key in configuration)
   * @returns Physical bucket name or default bucket
   */
  public getActualBucket(bucketName: string): string {
    return this.buckets[bucketName] || this.defaultBucket
  }

  /**
   * Upload a file from an HTML form (Multer)
   * @param bucketName - Logical bucket name
   * @param file - Multer file object
   * @param options - Upload options (directory, filename, content type, generateRandomFilename)
   * @returns UploadResult containing key, name, size, and content type
   */
  public async uploadFormFile(
    bucketName: string,
    file: Express.Multer.File,
    options?: {
      directory?: string
      generateRandomFilename?: boolean
      filename?: string
    }
  ): Promise<UploadResult> {
    const { directory, generateRandomFilename, filename } = options || {}
    const name = file.originalname.includes('.')
      ? file.originalname.substring(0, file.originalname.lastIndexOf('.'))
      : file.originalname
    const finalFilename = this.getFinalFileName(name, generateRandomFilename)
    const key = path.join(directory || '', finalFilename)

    try {
      await this.client.putObject(
        this.getActualBucket(bucketName),
        key,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        }
      )

      return {
        key,
        name: filename || name,
        size: file.size,
        contentType: file.mimetype,
      }
    } catch (error) {
      this.logger.error(
        `Failed to upload file to S3: ${ErrorUtil.message(error)}`
      )
      throw error
    }
  }

  /**
   * Upload raw text content as a file
   * @param bucketName - Logical bucket name
   * @param text - Text content to upload
   * @param options - Upload options
   * @returns UploadResult
   */
  public async uploadText(
    bucketName: string,
    text: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const { directory, filename, contentType, generateRandomFilename } =
      options || {}
    const buffer = Buffer.from(text, 'utf-8')
    const finalFilename = this.getFinalFileName(
      filename || '',
      generateRandomFilename,
      '.txt'
    )
    const key = path.join(directory || '', finalFilename)
    const type = contentType || 'text/plain'

    try {
      await this.client.putObject(
        this.getActualBucket(bucketName),
        key,
        buffer,
        buffer.length,
        {
          'Content-Type': type,
        }
      )

      return {
        key,
        name: finalFilename,
        size: buffer.length,
        contentType: type,
      }
    } catch (error) {
      this.logger.error(
        `Failed to upload text to S3: ${ErrorUtil.message(error)}`
      )
      throw error
    }
  }

  /**
   * Upload a binary buffer
   * @param bucketName - Logical bucket name
   * @param buffer - Binary data buffer
   * @param options - Upload options
   * @returns UploadResult
   */
  public async uploadBuffer(
    bucketName: string,
    buffer: Buffer,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const { directory, filename, contentType, generateRandomFilename } =
      options || {}
    const finalFilename = this.getFinalFileName(
      filename || '',
      generateRandomFilename
    )
    const key = path.join(directory || '', finalFilename)
    const type = contentType || 'application/octet-stream'

    try {
      await this.client.putObject(
        this.getActualBucket(bucketName),
        key,
        buffer,
        buffer.length,
        {
          'Content-Type': type,
        }
      )

      return {
        key,
        name: finalFilename,
        size: buffer.length,
        contentType: type,
      }
    } catch (error) {
      this.logger.error(
        `Failed to upload buffer to S3: ${ErrorUtil.message(error)}`
      )
      throw error
    }
  }

  /**
   * Download a file from a URL and upload it to S3
   * @param bucketName - Logical bucket name
   * @param url - Source URL to download from
   * @param options - Upload options
   * @returns UploadResult
   */
  public async uploadUrl(
    bucketName: string,
    url: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const { directory, filename, contentType, generateRandomFilename } =
      options || {}
    const finalFilename = this.getFinalFileName(
      filename || '',
      generateRandomFilename
    )
    const key = path.join(directory || '', finalFilename)
    const type = contentType || 'application/octet-stream'

    try {
      const buffer = await this.http.downloadFileBuffer(url)
      await this.client.putObject(
        this.getActualBucket(bucketName),
        key,
        buffer,
        buffer.length,
        {
          'Content-Type': type,
        }
      )

      return {
        key,
        name: finalFilename,
        size: 0,
        contentType: type,
      }
    } catch (error) {
      this.logger.error(
        `Failed to upload URL to S3: ${ErrorUtil.message(error)}`
      )
      throw error
    }
  }

  /**
   * Check if a file exists in S3 bucket by key
   * @param bucketName The business bucket name (may not be a real bucket name)
   * @param key The file key
   * @returns True if file exists, false otherwise
   */
  public async isFileExists(bucketName: string, key: string): Promise<boolean> {
    try {
      await this._client.statObject(this.getActualBucket(bucketName), key)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get a file from S3 bucket by key
   * @param bucketName The business bucket name (may not be a real bucket name)
   * @param key The file key
   * @returns The file buffer
   */
  public async getFile(bucketName: string, key: string): Promise<Buffer> {
    const stream = await this.client.getObject(
      this.getActualBucket(bucketName),
      key
    )
    return this.streamToBuffer(stream)
  }

  /**
   * Get a presigned URL for a file in S3 bucket by key
   * @param bucketName The business bucket name (may not be a real bucket name)
   * @param key The file key
   * @returns The presigned URL
   */
  public async getUrl(bucketName: string, key: string): Promise<string> {
    const url = await this.client.presignedGetObject(
      this.getActualBucket(bucketName),
      key
    )
    const prefix = this.configService.get('storage.publicUrlPrefix')
    if (prefix) {
      try {
        const urlObj = new URL(url)
        const prefixObj = new URL(prefix)
        urlObj.protocol = prefixObj.protocol
        urlObj.host = prefixObj.host
        urlObj.port = prefixObj.port
        return urlObj.toString()
      } catch (e) {
        if (url.startsWith('http')) {
          return url
        }
        return `${prefix}${url}`
      }
    }
    return url
  }

  /**
   * Get a public URL for a file in S3 bucket by key
   * @param key The file key
   * @returns The public URL
   */
  public async getPublicUrl(key: string): Promise<string> {
    let prefix = this.configService.get('storage.publicUrlPrefix')
    if (!prefix) {
      prefix = ''
    }
    if (!prefix.endsWith('/')) {
      prefix += '/'
    }
    if (!key.startsWith('/')) {
      key = `/${key}`
    }
    return `${prefix}${key}`
  }

  /**
   * Ensure that all configured buckets exist, creating them if necessary.
   * This is called during initialization.
   */
  private async ensureBucketExists(): Promise<void> {
    for (const bucket of [this.defaultBucket, ...Object.values(this.buckets)]) {
      try {
        const exists = await this.client.bucketExists(bucket)
        if (!exists) {
          await this.client.makeBucket(bucket)
          this.logger.log(`Created bucket: ${bucket}`)
        }
      } catch (error) {
        this.logger.error(
          `Failed to ensure bucket exists: ${ErrorUtil.message(error)}`
        )
      }
    }
  }

  /**
   * Convert a Readable stream to a Buffer
   * @param stream - The readable stream
   * @returns Promise resolving to the complete Buffer
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      stream.on('error', (err) => reject(err))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
  }

  /**
   * Get the final filename to be used in S3 upload, with random filename generation if needed.
   * @param filename - The original filename
   * @param generateRandomFilename - Whether to generate a random filename
   * @param defaultExtension - The default extension to use if filename doesn't have one
   * @returns The final filename to use in S3 upload
   */
  private getFinalFileName(
    filename: string,
    generateRandomFilename?: boolean,
    defaultExtension?: string
  ): string {
    const extension = filename?.includes('.')
      ? `.${filename.split('.').pop()}`
      : defaultExtension || ''

    let finalFilename: string
    if (generateRandomFilename) {
      finalFilename = `${createId()}${extension}`
    } else if (filename) {
      finalFilename = filename
    } else {
      finalFilename = `${createId()}${extension}`
    }
    return finalFilename
  }
}
