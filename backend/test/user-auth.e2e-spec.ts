import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/common/prisma/prisma.service'
import { UserService } from '@/user/user.service'

describe('UserController (e2e)', () => {
  let app: INestApplication
  let prismaService: PrismaService
  let userService: UserService

  const testUser = {
    email: 'test_e2e@example.com',
    password: 'password123',
    name: 'Test User',
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ transform: true }))
    prismaService = app.get<PrismaService>(PrismaService)
    userService = app.get<UserService>(UserService)
    await app.init()

    // Clean up potential leftover
    await prismaService.user.deleteMany({
      where: {
        email: testUser.email,
      },
    })
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

  let authToken: string

  const login = async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201)
    authToken = res.body.accessToken
    return authToken
  }

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id')
        expect(res.body.email).toEqual(testUser.email)
        expect(res.body.name).toEqual(testUser.name)
        expect(res.body).not.toHaveProperty('password')
        expect(res.body).not.toHaveProperty('passwordHash')
      })
  })

  it('/auth/register (POST) - Fail with invalid email', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...testUser,
        email: 'invalid-email',
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('email must be an email')
      })
  })

  it('/auth/register (POST) - Fail with short password', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...testUser,
        password: '123',
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toEqual(
          expect.arrayContaining([
            'password must be longer than or equal to 5 characters',
          ])
        )
      })
  })

  it('/auth/register (POST) - Fail with duplicate email', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(409) // Conflict
      .expect((res) => {
        expect(res.body.message).toEqual('Email already registered')
      })
  })

  it('/auth/login (POST)', async () => {
    const accessToken = await login()
    expect(accessToken).toBeDefined()
  })

  it('/auth/login (POST) - Fail with invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toEqual('Invalid credentials')
      })
  })

  it('/auth/login (POST) - Fail with non-existent user', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toEqual('Invalid credentials')
      })
  })

  it('/auth/me (GET)', async () => {
    if (!authToken) await login()
    return request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toEqual(testUser.email)
        expect(res.body.name).toEqual(testUser.name)
      })
  })

  it('/auth/me (GET) - Unauthorized', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401)
  })

  it('should cache /auth/me response', async () => {
    if (!authToken) await login()
    // Prime the cache first
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    const findByIdSpy = jest.spyOn(userService, 'findById')

    // Call - should hit cache
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    // Verify findById was NOT called (cache hit)
    expect(findByIdSpy).toHaveBeenCalledTimes(0)

    findByIdSpy.mockRestore()
  })

  it('/auth/me (PATCH) - Update Profile', async () => {
    if (!authToken) await login()
    const newName = 'Updated User Name'
    return request(app.getHttpServer())
      .patch('/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: newName })
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toEqual(newName)
      })
  })

  it('/auth/me (PATCH) - Fail with invalid data', async () => {
    if (!authToken) await login()
    return request(app.getHttpServer())
      .patch('/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'a' }) // Too short
      .expect(400)
  })

  it('should invalidate cache after update', async () => {
    if (!authToken) await login()
    const findByIdSpy = jest.spyOn(userService, 'findById')

    // Wait a bit for cache invalidation to complete (async background process)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Call GET /auth/me - should hit database because cache was invalidated by PATCH
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toEqual('Updated User Name')
      })

    expect(findByIdSpy).toHaveBeenCalledTimes(1)

    findByIdSpy.mockRestore()
  })
})
