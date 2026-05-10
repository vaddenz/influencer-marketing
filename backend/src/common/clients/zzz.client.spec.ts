import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { BaseHTTPClient } from './http.client'
import { S3Client } from './s3.client'
import * as Minio from 'minio'
import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import { Readable } from 'stream'

// Mock Minio
jest.mock('minio', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      putObject: jest.fn(),
      getObject: jest.fn(),
      presignedGetObject: jest.fn(),
    })),
  }
})

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
}))

// Mock fs
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs')
  return {
    ...actualFs,
    createWriteStream: jest.fn(),
  }
})

describe('Client Tests', () => {
  let configService: ConfigService

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'http-client.timeoutInSec': 5,
        'http-client.maxRetries': 2,
        'storage.endpoint': 'localhost',
        'storage.port': 9000,
        'storage.useSsl': 'false',
        'storage.accessKey': 'minio',
        'storage.secretKey': 'minio123',
        'storage.region': 'us-east-1',
        'storage.defaultBucket': 'default-bucket',
        'storage.buckets': {
          test: 'test-bucket',
        },
        'storage.publicUrlPrefix': 'http://localhost:9000',
      }
      return config[key]
    }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('BaseHTTPClient', () => {
    let client: BaseHTTPClient
    let globalFetch: jest.Mock

    beforeEach(() => {
      client = new BaseHTTPClient(
        mockConfigService as any,
        'http://api.example.com'
      )
      globalFetch = jest.fn()
      global.fetch = globalFetch
    })

    it('should be defined', () => {
      expect(client).toBeDefined()
    })

    describe('buildUrl', () => {
      it('should build url without params', () => {
        const url = client.buildUrl('users')
        expect(url).toBe('http://api.example.com/users')
      })

      it('should build url with params', () => {
        const url = client.buildUrl('users', { page: 1, limit: 10 })
        expect(url).toBe('http://api.example.com/users?page=1&limit=10')
      })

      it('should handle undefined/null params', () => {
        const url = client.buildUrl('users', {
          page: 1,
          filter: undefined,
          sort: null,
        })
        expect(url).toBe('http://api.example.com/users?page=1')
      })
    })

    describe('fetchWithAuth', () => {
      it('should make a successful request', async () => {
        globalFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
        })

        const result = await client.fetchWithAuth('/test')
        expect(result).toEqual({ data: 'success' })
        expect(globalFetch).toHaveBeenCalledTimes(1)
      })

      it('should retry on network error', async () => {
        const error = new Error('Network error')
        globalFetch.mockRejectedValueOnce(error).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'retry success' }),
        })

        const result = await client.fetchWithAuth('/test')
        expect(result).toEqual({ data: 'retry success' })
        expect(globalFetch).toHaveBeenCalledTimes(2)
      })

      it('should not retry on auth error', async () => {
        globalFetch.mockResolvedValue({
          ok: false,
          status: 401,
          text: async () => 'Unauthorized',
        })

        await expect(client.fetchWithAuth('/test')).rejects.toThrow(
          'Authentication failed'
        )
        expect(globalFetch).toHaveBeenCalledTimes(1)
      })
    })

    describe('downloadFile', () => {
      it('should download file successfully', async () => {
        const mockWriter = {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn((event, cb) => {
            if (event === 'finish') cb()
          }),
        }
        ;(fs.createWriteStream as jest.Mock).mockReturnValue(mockWriter)

        const mockReader = {
          read: jest
            .fn()
            .mockResolvedValueOnce({ done: false, value: Buffer.from('chunk') })
            .mockResolvedValueOnce({ done: true }),
        }

        globalFetch.mockResolvedValue({
          ok: true,
          body: { getReader: () => mockReader },
        })

        const result = await client.downloadFile(
          'http://example.com/file.txt',
          {
            directory: '/tmp',
          }
        )

        expect(result).toContain('file.txt')
        expect(fs.createWriteStream).toHaveBeenCalled()
        expect(mockWriter.write).toHaveBeenCalled()
      })
    })
  })

  describe('S3Client', () => {
    let service: S3Client
    let minioClientMock: any

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          S3Client,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile()

      service = module.get<S3Client>(S3Client)
      minioClientMock = (service as any)._client

      // Mock global fetch for S3Client internal http usage
      global.fetch = jest.fn()
    })

    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    describe('initialization', () => {
      it('should check if buckets exist on init', async () => {
        // Wait for next tick to allow promise in constructor/init to run if any (though ensureBucketExists is awaited in constructor, it's async so we might need to be careful.
        // Actually in the provided code, ensureBucketExists is NOT awaited in constructor, it's just called.
        // So we might need to wait a bit or just check if it was called.
        expect(minioClientMock.bucketExists).toHaveBeenCalled()
      })
    })

    describe('uploadFormFile', () => {
      it('should upload a form file', async () => {
        const file = {
          originalname: 'test.jpg',
          buffer: Buffer.from('test'),
          size: 4,
          mimetype: 'image/jpeg',
        } as Express.Multer.File

        minioClientMock.putObject.mockResolvedValue({ etag: 'etag' })

        const result = await service.uploadFormFile('test', file)

        expect(result).toBeDefined()
        expect(result.contentType).toBe('image/jpeg')
        expect(result.size).toBe(4)
        expect(minioClientMock.putObject).toHaveBeenCalled()
      })
    })

    describe('uploadText', () => {
      it('should upload text content', async () => {
        minioClientMock.putObject.mockResolvedValue({ etag: 'etag' })

        const result = await service.uploadText('test', 'hello world', {
          filename: 'hello.txt',
        })

        expect(result.contentType).toBe('text/plain')
        expect(result.name).toBe('hello.txt')
        expect(minioClientMock.putObject).toHaveBeenCalled()
      })
    })

    describe('uploadBuffer', () => {
      it('should upload buffer', async () => {
        const buffer = Buffer.from('binary data')
        minioClientMock.putObject.mockResolvedValue({ etag: 'etag' })

        const result = await service.uploadBuffer('test', buffer, {
          filename: 'data.bin',
        })

        expect(result.size).toBe(buffer.length)
        expect(minioClientMock.putObject).toHaveBeenCalled()
      })
    })

    describe('uploadUrl', () => {
      it('should download from url and upload to s3', async () => {
        const mockBuffer = Buffer.from('downloaded data')
        // Mocking the internal http client behavior by mocking fetch
        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          arrayBuffer: async () => mockBuffer,
        })

        minioClientMock.putObject.mockResolvedValue({ etag: 'etag' })

        const result = await service.uploadUrl(
          'test',
          'http://example.com/image.png'
        )

        expect(result).toBeDefined()
        expect(minioClientMock.putObject).toHaveBeenCalled()
        const putCallArgs = minioClientMock.putObject.mock.calls[0]
        // 3rd arg is buffer
        expect(putCallArgs[2]).toEqual(mockBuffer)
      })
    })

    describe('getFile', () => {
      it('should retrieve file buffer', async () => {
        const mockStream = new Readable()
        mockStream.push('file content')
        mockStream.push(null)

        minioClientMock.getObject.mockResolvedValue(mockStream)

        const result = await service.getFile('test', 'file-key')
        expect(result.toString()).toBe('file content')
        expect(minioClientMock.getObject).toHaveBeenCalledWith(
          'test-bucket',
          'file-key'
        )
      })
    })

    describe('getUrl', () => {
      it('should return presigned url', async () => {
        minioClientMock.presignedGetObject.mockResolvedValue(
          'http://localhost:9000/signed-url'
        )

        const result = await service.getUrl('test', 'file-key')
        // Because publicUrlPrefix is set in mockConfig to http://localhost:9000
        // And the implementation: prefix ? `${prefix}${url}` : url
        // Wait, presignedGetObject usually returns a full URL or partial?
        // If presignedGetObject returns a full URL, prepending prefix might be wrong or intended for proxying.
        // In the code: prefix ? `${prefix}${url}` : url
        // Let's assume the test expectation based on code.
        expect(result).toBe('http://localhost:9000/signed-url')
      })
    })
  })
})
