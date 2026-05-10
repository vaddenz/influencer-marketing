import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/common/prisma/prisma.service'
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor'
import { GLOBAL_PREFIX, HEALTH_CHECK_PATH } from '@/common/const/app'

const BRAND_EMAIL = 'brand@flow.test'
const BRAND_PASSWORD = 'password123'
const INFLUENCER_EMAIL = 'influencer@flow.test'
const INFLUENCER_PASSWORD = 'password123'

describe('Brand Flow (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let brandAccessToken: string
  let influencerAccessToken: string
  let campaignId: string
  let influencerId: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix(GLOBAL_PREFIX)
    app.useGlobalPipes(new ValidationPipe({ transform: true }))
    app.useGlobalInterceptors(new TransformInterceptor([HEALTH_CHECK_PATH]))
    prisma = app.get(PrismaService)
    await app.init()

    await prisma.notification.deleteMany()
    await prisma.deliverable.deleteMany()
    await prisma.invitation.deleteMany()
    await prisma.campaign.deleteMany()
    await prisma.brandProfile.deleteMany()
    await prisma.influencerProfile.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await app.close()
  })

  it('registers a brand', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: BRAND_EMAIL,
        password: BRAND_PASSWORD,
        name: 'Brand',
        role: 'brand',
      })
      .expect(201)
    expect(res.body.data.email).toEqual(BRAND_EMAIL)
  })

  it('logs in as brand', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: BRAND_EMAIL, password: BRAND_PASSWORD })
      .expect(201)
    brandAccessToken = res.body.data.accessToken
    expect(brandAccessToken).toBeDefined()
  })

  it('creates brand profile', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/brands/me/profile')
      .set('Authorization', `Bearer ${brandAccessToken}`)
      .send({ companyName: 'Flow Brand Co', industry: 'Fashion' })
      .expect(201)
    expect(res.body.data.companyName).toEqual('Flow Brand Co')
    expect(res.body.data.industry).toEqual('Fashion')
  })

  it('creates a campaign', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${brandAccessToken}`)
      .send({
        title: 'Summer Promo',
        description: 'Create 1 Reel and 3 Stories',
      })
      .expect(201)
    campaignId = res.body.data.id
    expect(campaignId).toBeDefined()
  })

  it('registers an influencer', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: INFLUENCER_EMAIL,
        password: INFLUENCER_PASSWORD,
        name: 'Jane',
        role: 'influencer',
      })
      .expect(201)
    influencerId = res.body.data.id
    expect(influencerId).toBeDefined()
  })

  it('logs in as influencer', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: INFLUENCER_EMAIL, password: INFLUENCER_PASSWORD })
      .expect(201)
    influencerAccessToken = res.body.data.accessToken
    expect(influencerAccessToken).toBeDefined()
  })

  it('creates influencer profile', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/influencers/me/profile')
      .set('Authorization', `Bearer ${influencerAccessToken}`)
      .send({
        displayName: 'Jane Doe',
        handle: '@flow_jane',
        niche: 'fashion',
        followerCount: 50000,
        engagementRate: 4.5,
        platforms: [
          {
            platform: 'instagram',
            url: 'https://instagram.com/flow_jane',
            followers: 50000,
          },
        ],
        locationCountry: 'US',
        locationRegion: 'California',
      })
      .expect(201)
    expect(res.body.data.displayName).toEqual('Jane Doe')
    expect(res.body.data.handle).toEqual('@flow_jane')
  })

  it('searches for influencers', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/influencers?niche=fashion')
      .set('Authorization', `Bearer ${brandAccessToken}`)
      .expect(200)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  it('sends invitation to influencer', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/invitations')
      .set('Authorization', `Bearer ${brandAccessToken}`)
      .send({
        campaignId,
        influencerId,
        message: 'Join our summer campaign!',
      })
      .expect(201)
  })

  it('returns 401 for unauthorized access', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/campaigns')
      .expect(401)
  })

  it('returns 409 for duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: BRAND_EMAIL,
        password: BRAND_PASSWORD,
        name: 'Brand Duplicate',
        role: 'brand',
      })
      .expect(409)
  })

  it('returns 404 when inviting a non-existent influencer', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/invitations')
      .set('Authorization', `Bearer ${brandAccessToken}`)
      .send({
        campaignId,
        influencerId: 'nonexistent-id',
        message: 'Join our summer campaign!',
      })
      .expect(404)
  })
})
