import * as fs from 'fs'
import * as path from 'path'
import { Logger } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { S3Client } from '@/common/clients/s3.client'
import storageConfig from '@/common/config/storage.config'

describe('S3Client (e2e)', () => {
  let s3Client: S3Client
  let configService: ConfigService
  const testBucket = 'test-bucket-e2e'

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [storageConfig],
          ignoreEnvFile: false, // Ensure .env is loaded
        }),
      ],
      providers: [S3Client, Logger],
    }).compile()

    s3Client = moduleFixture.get<S3Client>(S3Client)
    configService = moduleFixture.get<ConfigService>(ConfigService)

    // Ensure test bucket exists (though S3Client constructor does this for configured buckets)
    // We might need to override defaultBucket for safety, but let's see if we can use the default one.
    // Ideally, we should use a test-specific bucket.
  })

  it('should be defined', () => {
    expect(s3Client).toBeDefined()
  })

  it('should upload text content', async () => {
    const text = 'Hello S3 E2E Test'
    const filename = 'hello.txt'
    const directory = 'e2e-test'

    // We use the configured default bucket
    const bucket = configService.get('storage.defaultBucket')

    const result = await s3Client.uploadText(bucket, text, {
      directory,
      filename,
      contentType: 'text/plain',
    })

    expect(result).toBeDefined()
    expect(result.key).toContain(directory)
    expect(result.name).toBe(filename)
    expect(result.contentType).toBe('text/plain')

    // Verify existence
    const exists = await s3Client.isFileExists(bucket, result.key)
    expect(exists).toBe(true)

    // Verify content
    const downloadedBuffer = await s3Client.getFile(bucket, result.key)
    expect(downloadedBuffer.toString()).toBe(text)
  })

  it('should upload buffer', async () => {
    const buffer = Buffer.from('Binary Content')
    const filename = 'binary.bin'
    const directory = 'e2e-test'
    const bucket = configService.get('storage.defaultBucket')

    const result = await s3Client.uploadBuffer(bucket, buffer, {
      directory,
      filename,
    })

    expect(result.key).toBeDefined()

    const exists = await s3Client.isFileExists(bucket, result.key)
    expect(exists).toBe(true)

    const downloadedBuffer = await s3Client.getFile(bucket, result.key)
    expect(downloadedBuffer.equals(buffer)).toBe(true)
  })

  it('should generate presigned url', async () => {
    const text = 'Url Test'
    const bucket = configService.get('storage.defaultBucket')
    const result = await s3Client.uploadText(bucket, text, {
      directory: 'e2e-test',
      filename: 'url-test.txt',
    })

    const url = await s3Client.getUrl(bucket, result.key)
    expect(url).toBeDefined()
    expect(typeof url).toBe('string')

    // Verify URL format
    const urlObj = new URL(url)
    expect(urlObj.protocol).toBeDefined()
    expect(urlObj.host).toBeDefined()

    // Ensure no duplication (simple check)
    expect(url).not.toContain('http://localhost:9900http://localhost:9900')

    console.log('Generated URL:', url)
  })

  it('should upload from url', async () => {
    // First upload a file to get a valid URL
    const text = 'Source Content'
    const bucket = configService.get('storage.defaultBucket')
    const source = await s3Client.uploadText(bucket, text, {
      directory: 'e2e-test',
      filename: 'source.txt',
    })
    const sourceUrl = await s3Client.getUrl(bucket, source.key)

    // Now upload using that URL
    const filename = 'from-url.txt'
    const directory = 'e2e-test'

    const result = await s3Client.uploadUrl(bucket, sourceUrl, {
      directory,
      filename,
    })

    expect(result.key).toBeDefined()
    expect(result.name).toBe(filename)

    // Verify content
    const content = await s3Client.getFile(bucket, result.key)
    expect(content.toString()).toBe(text)
  })

  it('should upload form file', async () => {
    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test-form.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      buffer: Buffer.from('Form File Content'),
      size: 17,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    }

    const bucket = configService.get('storage.defaultBucket')
    const result = await s3Client.uploadFormFile(bucket, file, {
      directory: 'e2e-test',
    })

    expect(result.key).toBeDefined()
    expect(result.name).toBe('test-form')

    const content = await s3Client.getFile(bucket, result.key)
    expect(content.toString()).toBe('Form File Content')
  })

  it('should return false when file does not exist', async () => {
    const bucket = configService.get('storage.defaultBucket')
    const nonExistentKey = 'non-existent-file.txt'
    const exists = await s3Client.isFileExists(bucket, nonExistentKey)
    expect(exists).toBe(false)
  })

  it('should upload with generateRandomFilename option', async () => {
    const text = 'Random filename test content'
    const bucket = configService.get('storage.defaultBucket')
    const directory = 'e2e-test'
    const extension = '.txt'
    const customFilename = 'custom-name.txt'

    // Test with generateRandomFilename: true
    const result1 = await s3Client.uploadText(bucket, text, {
      directory,
      generateRandomFilename: true,
      contentType: 'text/plain',
    })

    expect(result1.key).toContain(directory)
    expect(result1.name).toMatch(/^[a-z0-9]+\.txt$/) // Should be random ID with .txt extension
    expect(result1.contentType).toBe('text/plain')

    // Test with generateRandomFilename: false and custom filename
    const result2 = await s3Client.uploadText(bucket, text, {
      directory,
      generateRandomFilename: false,
      filename: customFilename,
      contentType: 'text/plain',
    })

    expect(result2.key).toContain(directory)
    expect(result2.name).toBe(customFilename)
    expect(result2.contentType).toBe('text/plain')

    // Test with no generateRandomFilename option (should default to random)
    const result3 = await s3Client.uploadText(bucket, text, {
      directory,
      contentType: 'text/plain',
    })

    expect(result3.key).toContain(directory)
    expect(result3.name).toMatch(/^[a-z0-9]+\.txt$/) // Should be random ID with .txt extension

    // Verify all files exist
    expect(await s3Client.isFileExists(bucket, result1.key)).toBe(true)
    expect(await s3Client.isFileExists(bucket, result2.key)).toBe(true)
    expect(await s3Client.isFileExists(bucket, result3.key)).toBe(true)
  })
})
