import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { SseJwtAuthGuard } from '@/common/guards/sse-jwt-auth.guard'

describe('Scraper Search SSE (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(SseJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('should return SSE stream with internal event', (done) => {
    const events: string[] = []

    const req = request(app.getHttpServer())
      .get('/influencers/search-stream?q=test&token=fake-token')
      .buffer(true)
      .parse((res, callback) => {
        res.on('data', (chunk) => {
          events.push(chunk.toString())
        })
        res.on('end', () => {
          callback(null, events.join(''))
        })
      })

    req.end((err, res) => {
      if (err) return done(err)
      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('text/event-stream')
      const body = res.body as string
      expect(body).toContain('event: internal')
      expect(body).toContain('event: done')
      done()
    })
  })
})
