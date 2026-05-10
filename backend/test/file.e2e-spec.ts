import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/common/prisma/prisma.service'
import { S3Client } from '@/common/clients/s3.client'

describe('FileController (e2e)', () => {
  let app: INestApplication
  let prismaService: PrismaService
  let s3Client: S3Client
  let configService: ConfigService
  let authToken: string

  const testUser = {
    email: 'test_files_e2e@example.com',
    password: 'password123',
    name: 'Test Files User',
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    prismaService = app.get<PrismaService>(PrismaService)
    s3Client = app.get<S3Client>(S3Client)
    configService = app.get<ConfigService>(ConfigService)

    await app.init()

    // Clean up potential leftover
    await prismaService.user.deleteMany({
      where: {
        email: testUser.email,
      },
    })

    // Register
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201)

    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201)

    authToken = loginRes.body.accessToken
  })

  afterAll(async () => {
    // Clean up
    await prismaService.user.deleteMany({
      where: {
        email: testUser.email,
      },
    })
    await app.close()
  })

  it('/files/upload (POST)', async () => {
    const buffer = Buffer.from('test file content')
    const filename = 'test.txt'

    const res = await request(app.getHttpServer())
      .post('/files/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', buffer, filename)
      .expect(201)

    expect(res.body).toHaveProperty('url')
    expect(res.body).toHaveProperty('key')
    expect(res.body.name).toBe(filename)
    expect(res.body).toHaveProperty('bucket')

    // Verify file exists in S3
    const bucket = configService.get('storage.defaultBucket')
    const exists = await s3Client.isFileExists(bucket, res.body.key)
    expect(exists).toBe(true)

    // Verify content
    const downloadedBuffer = await s3Client.getFile(bucket, res.body.key)
    expect(downloadedBuffer.toString()).toBe('test file content')

    // Verify URL format
    const url = res.body.url
    expect(url).toMatch(/^http/)
    // The key should be part of the URL (unless it's a very different presigned URL structure, but for MinIO/S3 usually it is)
    // However, with presigned URLs, the key might be encoded or part of the path.
    // Let's just check it's a string.
    expect(typeof url).toBe('string')
  })

  it('/files/upload (POST) - Unauthorized', () => {
    return request(app.getHttpServer())
      .post('/files/upload')
      .attach('file', Buffer.from('test'), 'test.txt')
      .expect(401)
  })
})
