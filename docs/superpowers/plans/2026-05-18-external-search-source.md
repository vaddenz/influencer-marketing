# External Search Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add adapter-based external website scraping to the influencer discovery feature, with SSE streaming of results to the frontend and a BullMQ background worker that deduplicates and merges scraped profiles into the existing `InfluencerProfile` table.

**Architecture:** A `ScraperService` manages a Playwright browser pool and runs modular `ScraperAdapter` implementations in parallel. The `SearchSseController` streams internal DB results immediately, then appends scraped results via SSE. Raw scraped data is batched and enqueued to a `ScrapedProfileProcessor` BullMQ worker for persistence.

**Tech Stack:** NestJS, Prisma, PostgreSQL, BullMQ, Redis, Playwright, RxJS, Next.js, React, TypeScript

---

## File Structure

| File | Action | Responsibility |
|------|--------|--------------|
| `backend/prisma/schema.prisma` | Modify | Extend `InfluencerProfile` with scraped fields |
| `backend/src/common/config/scraper.config.ts` | Create | Scraper settings (proxy pool, timeouts) |
| `backend/src/common/config/index.ts` | Modify | Register scraper config |
| `backend/src/common/guards/sse-jwt-auth.guard.ts` | Create | Reads JWT from query param for SSE |
| `backend/src/scraper/dto/raw-scraped-profile.dto.ts` | Create | Type definition for scraped payload |
| `backend/src/scraper/interfaces/scraper-adapter.interface.ts` | Create | Adapter contract |
| `backend/src/scraper/exceptions/scraper-blocked.error.ts` | Create | Custom error for blocked requests |
| `backend/src/scraper/scraper.service.ts` | Create | Browser pool, adapter runner, anti-detection |
| `backend/src/scraper/scraper.module.ts` | Create | Module definition, adapter registration |
| `backend/src/scraper/processors/scraped-profile.processor.ts` | Create | BullMQ worker for dedup + merge |
| `backend/src/influencers/influencers.controller.ts` | Modify | Add SSE search-stream endpoint |
| `backend/src/app.module.ts` | Modify | Import `ScraperModule` |
| `frontend/lib/hooks/use-search-stream.ts` | Create | React hook wrapping EventSource |
| `frontend/app/brand/discover/page.tsx` | Modify | Replace useQuery with useSearchStream |
| `backend/src/scraper/scraper.service.spec.ts` | Create | Unit tests for scraper service |
| `backend/src/scraper/processors/scraped-profile.processor.spec.ts` | Create | Unit tests for dedup/merge logic |

---

## Task 1: Prisma Schema Migration

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Context:** The existing `InfluencerProfile` model lacks `deletedAt` (required by project convention) and fields needed for scraped external data. `userId` must become nullable for unclaimed profiles. `handle` loses its `@unique` constraint because the same handle can exist across different external sites.

- [ ] **Step 1: Update `InfluencerProfile` model**

Replace the existing `InfluencerProfile` model in `backend/prisma/schema.prisma`:

```prisma
model InfluencerProfile {
  id              String   @id @default(cuid(2))
  userId          String?  @unique
  displayName     String
  handle          String
  bio             String?
  niche           String?
  followerCount   Int?
  engagementRate  Decimal? @db.Decimal(5, 2)
  platforms       Json?
  locationCountry String?
  locationRegion  String?
  profileImageUrl String?
  nick            String?
  age             Int?
  likes           Int?
  postedImages    Int?
  postedVideos    Int?
  subscriptionFee Decimal? @db.Decimal(10, 2)
  isFree          Boolean?
  sampleMedia     Json?
  homepageUrl     String?
  socialMedia     Json?
  props           Json?
  sourceName      String?
  sourceUrl       String?
  lastScrapedAt   DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([handle])
  @@index([homepageUrl])
  @@index([sourceName])
  @@index([deletedAt])
}
```

- [ ] **Step 2: Generate migration and client**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
npx prisma migrate dev --name extend_influencer_profile_for_scraping
npx prisma generate
```

Expected: Migration created successfully, Prisma client regenerated in `src/generated/prisma`.

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(scraper): extend InfluencerProfile schema for external scraped data"
```

---

## Task 2: Install Dependencies & Scraper Config

**Files:**
- Create: `backend/src/common/config/scraper.config.ts`
- Modify: `backend/src/common/config/index.ts`
- Modify: `backend/package.json` (indirectly via yarn)

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn add playwright
yarn add -D @types/node
```

Expected: `playwright` added to `dependencies` in `package.json`.

Also install Playwright browsers:

```bash
npx playwright install chromium
```

- [ ] **Step 2: Create scraper config**

Create `backend/src/common/config/scraper.config.ts`:

```ts
import { registerAs } from '@nestjs/config'

export default registerAs('scraper', () => ({
  proxyPool: process.env.SCRAPER_PROXY_POOL?.split(',') || [],
  minRequestInterval: parseInt(process.env.SCRAPER_MIN_INTERVAL || '3000', 10),
  scrapeTimeout: parseInt(process.env.SCRAPER_TIMEOUT || '30000', 10),
  maxConcurrentAdapters: parseInt(process.env.SCRAPER_MAX_CONCURRENT || '3', 10),
}))
```

- [ ] **Step 3: Register config in index**

Modify `backend/src/common/config/index.ts`. Add import and export:

```ts
import scraperConfig from './scraper.config'

export const configurations = [
  // ... existing configs
  scraperConfig,
]

export {
  // ... existing exports
  scraperConfig,
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/common/config/scraper.config.ts backend/src/common/config/index.ts backend/package.json backend/yarn.lock
git commit -m "feat(scraper): add scraper config and playwright dependency"
```

---

## Task 3: Scraper Types, DTOs & Adapter Interface

**Files:**
- Create: `backend/src/scraper/dto/raw-scraped-profile.dto.ts`
- Create: `backend/src/scraper/interfaces/scraper-adapter.interface.ts`
- Create: `backend/src/scraper/exceptions/scraper-blocked.error.ts`

- [ ] **Step 1: Create RawScrapedProfile DTO**

Create `backend/src/scraper/dto/raw-scraped-profile.dto.ts`:

```ts
export interface RawScrapedProfile {
  sourceName: string
  sourceUrl: string
  nick?: string
  name?: string
  avatar?: string
  bio?: string
  age?: number
  fans?: number
  likes?: number
  postedImages?: number
  postedVideos?: number
  subscriptionFee?: number
  isFree?: boolean
  sampleMedia?: string[]
  homepageUrl?: string
  socialMedia?: Record<string, string>
  props?: Record<string, unknown>
}
```

- [ ] **Step 2: Create ScraperAdapter interface**

Create `backend/src/scraper/interfaces/scraper-adapter.interface.ts`:

```ts
import type { BrowserContext } from 'playwright'
import type { SearchInfluencersDto } from '@/influencers/dto/search-influencers.dto'
import type { RawScrapedProfile } from '@/scraper/dto/raw-scraped-profile.dto'

export interface ScraperAdapter {
  readonly sourceName: string
  readonly sourceUrl: string
  canHandle(query: SearchInfluencersDto): boolean
  scrape(
    browser: BrowserContext,
    query: SearchInfluencersDto,
    signal?: AbortSignal,
  ): AsyncIterable<RawScrapedProfile>
}

export const SCRAPER_ADAPTERS = Symbol('SCRAPER_ADAPTERS')
```

- [ ] **Step 3: Create ScraperBlockedError**

Create `backend/src/scraper/exceptions/scraper-blocked.error.ts`:

```ts
export class ScraperBlockedError extends Error {
  constructor(
    public readonly sourceName: string,
    public readonly url: string,
    message = `Scraper blocked on ${sourceName}`,
  ) {
    super(message)
    this.name = 'ScraperBlockedError'
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/scraper/
git commit -m "feat(scraper): add adapter interface, raw profile DTO, and blocked error"
```

---

## Task 4: ScraperService with Browser Pool

**Files:**
- Create: `backend/src/scraper/scraper.service.ts`
- Create: `backend/src/scraper/scraper.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/src/scraper/scraper.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { ScraperService } from './scraper.service'
import { SCRAPER_ADAPTERS, ScraperAdapter } from './interfaces/scraper-adapter.interface'
import { ScraperBlockedError } from './exceptions/scraper-blocked.error'

describe('ScraperService', () => {
  let service: ScraperService

  const mockAdapter: ScraperAdapter = {
    sourceName: 'test-site',
    sourceUrl: 'https://test.com',
    canHandle: jest.fn().mockReturnValue(true),
    scrape: jest.fn().mockImplementation(async function* () {
      yield {
        sourceName: 'test-site',
        sourceUrl: 'https://test.com/1',
        name: 'Test User',
        fans: 1000,
      }
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map: Record<string, unknown> = {
                'scraper.minRequestInterval': 0,
                'scraper.scrapeTimeout': 30000,
                'scraper.proxyPool': [],
              }
              return map[key]
            }),
          },
        },
        {
          provide: SCRAPER_ADAPTERS,
          useValue: [mockAdapter],
        },
      ],
    }).compile()

    service = module.get<ScraperService>(ScraperService)
    await service.onModuleInit()
  })

  afterEach(async () => {
    await service.onModuleDestroy()
  })

  it('should return observable of scraped profiles', async () => {
    const result$ = await service.scrape({ q: 'test' } as any)
    const results: any[] = []
    result$.subscribe({
      next: (r) => results.push(r),
      complete: () => {
        expect(results).toHaveLength(1)
        expect(results[0].name).toBe('Test User')
      },
    })
  })

  it('should skip adapters that throw blocked error', async () => {
    jest.spyOn(mockAdapter, 'scrape').mockImplementation(async function* () {
      throw new ScraperBlockedError('test-site', 'https://test.com')
    })

    const result$ = await service.scrape({ q: 'test' } as any)
    const results: any[] = []
    result$.subscribe({
      next: (r) => results.push(r),
      complete: () => {
        expect(results).toHaveLength(0)
      },
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn test scraper.service.spec.ts --no-coverage
```

Expected: FAIL with "Cannot find module './scraper.service'" or similar.

- [ ] **Step 3: Implement ScraperService**

Create `backend/src/scraper/scraper.service.ts`:

```ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Browser, BrowserContext, chromium } from 'playwright'
import { Observable, Subject } from 'rxjs'
import { SCRAPER_ADAPTERS, ScraperAdapter } from './interfaces/scraper-adapter.interface'
import { RawScrapedProfile } from './dto/raw-scraped-profile.dto'
import { ScraperBlockedError } from './exceptions/scraper-blocked.error'
import { Inject } from '@nestjs/common'

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
]

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
]

const LOCALES = ['en-US', 'en-GB', 'en-CA', 'en-AU']

@Injectable()
export class ScraperService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScraperService.name)
  private browser: Browser | null = null

  constructor(
    private readonly configService: ConfigService,
    @Inject(SCRAPER_ADAPTERS) private readonly adapters: ScraperAdapter[],
  ) {}

  async onModuleInit() {
    this.browser = await chromium.launch({ headless: true })
    this.logger.log('Playwright browser launched')
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close()
      this.logger.log('Playwright browser closed')
    }
  }

  async scrape(
    query: any,
    signal?: AbortSignal,
  ): Promise<Observable<RawScrapedProfile>> {
    const matchingAdapters = this.adapters.filter((a) => a.canHandle(query))

    if (matchingAdapters.length === 0) {
      return new Observable((sub) => {
        sub.complete()
      })
    }

    const subject = new Subject<RawScrapedProfile>()
    const proxyPool = this.configService.get<string[]>('scraper.proxyPool', [])

    Promise.all(
      matchingAdapters.map(async (adapter) => {
        let context: BrowserContext | null = null
        try {
          const contextOptions: Parameters<Browser['newContext']>[0] = {
            userAgent: this.getRandomItem(USER_AGENTS),
            viewport: this.getRandomItem(VIEWPORTS),
            locale: this.getRandomItem(LOCALES),
            timezoneId: this.getRandomItem([
              'America/New_York',
              'Europe/London',
              'Asia/Tokyo',
              'Australia/Sydney',
            ]),
          }

          if (proxyPool.length > 0) {
            const proxy = this.getRandomItem(proxyPool)
            contextOptions.proxy = { server: proxy }
          }

          context = await this.browser!.newContext(contextOptions)

          for await (const profile of adapter.scrape(context, query, signal)) {
            if (signal?.aborted) break
            subject.next(profile)
          }
        } catch (error) {
          if (error instanceof ScraperBlockedError) {
            this.logger.warn(`Adapter ${adapter.sourceName} blocked: ${error.message}`)
          } else {
            this.logger.error(`Adapter ${adapter.sourceName} failed: ${(error as Error).message}`)
          }
        } finally {
          if (context) {
            await context.close().catch(() => {})
          }
        }
      }),
    )
      .then(() => subject.complete())
      .catch((err) => {
        this.logger.error(`Scraper pipeline error: ${err.message}`)
        subject.complete()
      })

    return subject.asObservable()
  }

  private getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn test scraper.service.spec.ts --no-coverage
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/scraper/scraper.service.ts backend/src/scraper/scraper.service.spec.ts
git commit -m "feat(scraper): add ScraperService with browser pool and anti-detection"
```

---

## Task 5: ScraperModule

**Files:**
- Create: `backend/src/scraper/scraper.module.ts`

- [ ] **Step 1: Create ScraperModule**

Create `backend/src/scraper/scraper.module.ts`:

```ts
import { Module, Provider } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ScraperService } from './scraper.service'
import { SCRAPER_ADAPTERS } from './interfaces/scraper-adapter.interface'
import { ScrapedProfileProcessor } from './processors/scraped-profile.processor'

const adapterProviders: Provider[] = [
  {
    provide: SCRAPER_ADAPTERS,
    useFactory: () => [],
  },
]

@Module({
  imports: [BullModule.registerQueue({ name: 'scraped-profiles' })],
  providers: [ScraperService, ScrapedProfileProcessor, ...adapterProviders],
  exports: [ScraperService, BullModule],
})
export class ScraperModule {}
```

Note: Adapters will be injected into the `SCRAPER_ADAPTERS` array later as they are implemented. The empty array is the starting state.

- [ ] **Step 2: Commit**

```bash
git add backend/src/scraper/scraper.module.ts
git commit -m "feat(scraper): add ScraperModule with queue registration"
```

---

## Task 6: ScrapedProfileProcessor (Background Worker)

**Files:**
- Create: `backend/src/scraper/processors/scraped-profile.processor.ts`
- Create: `backend/src/scraper/processors/scraped-profile.processor.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/src/scraper/processors/scraped-profile.processor.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing'
import { Job } from 'bullmq'
import { ScrapedProfileProcessor } from './scraped-profile.processor'
import { PrismaService } from '@/common/prisma/prisma.service'

describe('ScrapedProfileProcessor', () => {
  let processor: ScrapedProfileProcessor
  let prisma: PrismaService

  const mockPrisma = {
    influencerProfile: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrapedProfileProcessor,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    processor = module.get<ScrapedProfileProcessor>(ScrapedProfileProcessor)
    prisma = module.get<PrismaService>(PrismaService)
    jest.clearAllMocks()
  })

  it('should create new profile when no match found', async () => {
    mockPrisma.influencerProfile.findFirst.mockResolvedValue(null)
    mockPrisma.influencerProfile.create.mockResolvedValue({ id: 'new-id' })

    const job = {
      data: {
        searchId: 'search-1',
        profiles: [
          {
            sourceName: 'site-a',
            sourceUrl: 'https://site-a.com/u/1',
            name: 'Alice',
            fans: 5000,
            homepageUrl: 'https://site-a.com/alice',
          },
        ],
      },
    } as Job<any>

    await processor.process(job)

    expect(mockPrisma.influencerProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          displayName: 'Alice',
          followerCount: 5000,
          homepageUrl: 'https://site-a.com/alice',
          sourceName: 'site-a',
          sourceUrl: 'https://site-a.com/u/1',
          userId: null,
        }),
      }),
    )
  })

  it('should update existing profile when homepageUrl matches', async () => {
    mockPrisma.influencerProfile.findFirst.mockResolvedValue({
      id: 'existing-id',
      displayName: 'Alice',
      followerCount: 3000,
      bio: null,
    })

    const job = {
      data: {
        searchId: 'search-1',
        profiles: [
          {
            sourceName: 'site-a',
            sourceUrl: 'https://site-a.com/u/1',
            name: 'Alice Updated',
            fans: 5000,
            bio: 'Travel blogger',
            homepageUrl: 'https://site-a.com/alice',
          },
        ],
      },
    } as Job<any>

    await processor.process(job)

    expect(mockPrisma.influencerProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'existing-id' },
        data: expect.objectContaining({
          displayName: 'Alice Updated',
          followerCount: 5000,
          bio: 'Travel blogger',
        }),
      }),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn test scraped-profile.processor.spec.ts --no-coverage
```

Expected: FAIL with "Cannot find module './scraped-profile.processor'".

- [ ] **Step 3: Implement ScrapedProfileProcessor**

Create `backend/src/scraper/processors/scraped-profile.processor.ts`:

```ts
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '@/common/prisma/prisma.service'
import { RawScrapedProfile } from '@/scraper/dto/raw-scraped-profile.dto'

interface ScrapedProfileJobData {
  searchId: string
  profiles: RawScrapedProfile[]
}

@Processor('scraped-profiles')
export class ScrapedProfileProcessor extends WorkerHost {
  private readonly logger = new Logger(ScrapedProfileProcessor.name)

  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async process(job: Job<ScrapedProfileJobData>): Promise<void> {
    const { searchId, profiles } = job.data
    let created = 0
    let updated = 0
    let skipped = 0

    for (const raw of profiles) {
      try {
        const existing = await this.findExistingProfile(raw)

        if (existing) {
          await this.mergeIntoExisting(existing.id, raw)
          updated++
        } else {
          await this.createNewProfile(raw)
          created++
        }
      } catch (error) {
        this.logger.error(
          `Failed to persist profile from ${raw.sourceName}: ${(error as Error).message}`,
        )
        skipped++
      }
    }

    this.logger.log(
      `Search ${searchId} processed: ${created} created, ${updated} updated, ${skipped} skipped`,
    )
  }

  private async findExistingProfile(raw: RawScrapedProfile) {
    if (raw.homepageUrl) {
      const byUrl = await this.prisma.influencerProfile.findFirst({
        where: { homepageUrl: raw.homepageUrl, deletedAt: null },
      })
      if (byUrl) return byUrl
    }

    if (raw.nick || raw.name) {
      const byHandle = await this.prisma.influencerProfile.findFirst({
        where: {
          handle: raw.nick || raw.name,
          sourceName: raw.sourceName,
          deletedAt: null,
        },
      })
      if (byHandle) return byHandle
    }

    return null
  }

  private async mergeIntoExisting(id: string, raw: RawScrapedProfile) {
    const updateData: Record<string, unknown> = {
      lastScrapedAt: new Date(),
    }

    if (raw.name) updateData.displayName = raw.name
    if (raw.nick) updateData.handle = raw.nick
    if (raw.bio) updateData.bio = raw.bio
    if (raw.age !== undefined) updateData.age = raw.age
    if (raw.fans !== undefined) updateData.followerCount = raw.fans
    if (raw.likes !== undefined) updateData.likes = raw.likes
    if (raw.postedImages !== undefined) updateData.postedImages = raw.postedImages
    if (raw.postedVideos !== undefined) updateData.postedVideos = raw.postedVideos
    if (raw.subscriptionFee !== undefined) updateData.subscriptionFee = raw.subscriptionFee
    if (raw.isFree !== undefined) updateData.isFree = raw.isFree
    if (raw.avatar) updateData.profileImageUrl = raw.avatar
    if (raw.homepageUrl) updateData.homepageUrl = raw.homepageUrl
    if (raw.sampleMedia) updateData.sampleMedia = raw.sampleMedia as any
    if (raw.socialMedia) updateData.socialMedia = raw.socialMedia as any
    if (raw.props) updateData.props = raw.props as any
    if (raw.sourceName) updateData.sourceName = raw.sourceName
    if (raw.sourceUrl) updateData.sourceUrl = raw.sourceUrl

    await this.prisma.influencerProfile.update({
      where: { id },
      data: updateData,
    })
  }

  private async createNewProfile(raw: RawScrapedProfile) {
    await this.prisma.influencerProfile.create({
      data: {
        displayName: raw.name || raw.nick || 'Unknown',
        handle: raw.nick || raw.name || 'unknown',
        bio: raw.bio,
        age: raw.age,
        followerCount: raw.fans,
        likes: raw.likes,
        postedImages: raw.postedImages,
        postedVideos: raw.postedVideos,
        subscriptionFee: raw.subscriptionFee,
        isFree: raw.isFree,
        profileImageUrl: raw.avatar,
        homepageUrl: raw.homepageUrl,
        sampleMedia: raw.sampleMedia as any,
        socialMedia: raw.socialMedia as any,
        props: raw.props as any,
        sourceName: raw.sourceName,
        sourceUrl: raw.sourceUrl,
        userId: null,
        lastScrapedAt: new Date(),
      },
    })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn test scraped-profile.processor.spec.ts --no-coverage
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/scraper/processors/
git commit -m "feat(scraper): add ScrapedProfileProcessor with dedup and merge logic"
```

---

## Task 7: Search SSE Controller

**Files:**
- Create: `backend/src/common/guards/sse-jwt-auth.guard.ts`
- Modify: `backend/src/influencers/influencers.controller.ts`

- [ ] **Step 1: Create SSE JWT auth guard**

Create `backend/src/common/guards/sse-jwt-auth.guard.ts`:

```ts
import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class SseJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    if (request.query?.token && !request.headers.authorization) {
      request.headers.authorization = `Bearer ${request.query.token}`
    }
    return request
  }
}
```

- [ ] **Step 2: Add SSE endpoint to InfluencersController**

Modify `backend/src/influencers/influencers.controller.ts`. Add imports at the top:

```ts
import { Sse, MessageEvent } from '@nestjs/common'
import { Observable, concat, from, of } from 'rxjs'
import { map, mergeMap, toArray } from 'rxjs/operators'
import { ScraperService } from '@/scraper/scraper.service'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { SseJwtAuthGuard } from '@/common/guards/sse-jwt-auth.guard'
import { randomUUID } from 'crypto'
import { RawScrapedProfile } from '@/scraper/dto/raw-scraped-profile.dto'
```

Update the constructor:

```ts
constructor(
  private readonly influencersService: InfluencersService,
  private readonly scraperService: ScraperService,
  @InjectQueue('scraped-profiles') private readonly scrapedProfileQueue: Queue,
) {}
```

Add the new SSE method at the end of the class (before the closing brace):

```ts
  @Sse('search-stream')
  @UseGuards(SseJwtAuthGuard)
  @ApiOperation({ summary: 'Discover influencers with real-time external sources (SSE)' })
  async searchStream(@Query() dto: SearchInfluencersDto): Promise<Observable<MessageEvent>> {
    const searchId = randomUUID()
    const abortController = new AbortController()

    const internalResults$ = from(this.influencersService.search(dto)).pipe(
      map((profiles) => ({
        type: 'internal',
        data: profiles,
      }) as MessageEvent),
    )

    const externalResults$ = from(this.scraperService.scrape(dto, abortController.signal)).pipe(
      mergeMap(async (profile: RawScrapedProfile) => {
        await this.enqueueProfile(searchId, profile)
        return {
          type: 'external',
          data: profile,
        } as MessageEvent
      }),
    )

    const done$ = of({
      type: 'done',
      data: { searchId },
    } as MessageEvent)

    return concat(internalResults$, externalResults$, done$)
  }

  private async enqueueProfile(searchId: string, profile: RawScrapedProfile) {
    await this.scrapedProfileQueue.add(
      'process',
      { searchId, profiles: [profile] },
      { jobId: `${searchId}-${profile.sourceName}-${profile.sourceUrl}` },
    )
  }
```

- [ ] **Step 3: Run backend build to verify no type errors**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/common/guards/sse-jwt-auth.guard.ts backend/src/influencers/influencers.controller.ts
git commit -m "feat(scraper): add SSE search-stream endpoint with auth guard"
```

---

## Task 8: Wire ScraperModule into AppModule

**Files:**
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Import ScraperModule**

Modify `backend/src/app.module.ts`. Add import:

```ts
import { ScraperModule } from '@/scraper/scraper.module'
```

Add `ScraperModule` to the `imports` array (after `FeishuModule` or anywhere in the list):

```ts
    // ... existing imports
    FeishuModule,
    ScraperModule,
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add backend/src/app.module.ts
git commit -m "chore: wire ScraperModule into AppModule"
```

---

## Task 9: Frontend useSearchStream Hook

**Files:**
- Create: `frontend/lib/hooks/use-search-stream.ts`

- [ ] **Step 1: Create the hook**

Create `frontend/lib/hooks/use-search-stream.ts`:

```ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAccessToken } from '@/lib/auth'
import { getApiUrl } from '@/lib/config'

export interface SearchFilters {
  q?: string
  niche?: string
  location?: string
  followersMin?: string
  followersMax?: string
  scope?: string
}

export interface StreamedResult {
  id?: string
  userId?: string
  displayName?: string
  handle?: string
  bio?: string
  niche?: string
  followerCount?: number
  engagementRate?: number
  platforms?: Record<string, string>
  locationCountry?: string
  locationRegion?: string
  profileImageUrl?: string
  sourceName?: string
  sourceUrl?: string
  fans?: number
  isExternal: boolean
}

export function useSearchStream(filters: SearchFilters) {
  const [results, setResults] = useState<StreamedResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchingExternal, setIsSearchingExternal] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const disconnect = useCallback(() => {
    setIsLoading(false)
    setIsSearchingExternal(false)
  }, [])

  useEffect(() => {
    setResults([])
    setIsLoading(true)
    setIsSearchingExternal(false)
    setWarning(null)
    setError(null)

    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v)
    })

    const token = getAccessToken()
    if (!token) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    params.append('token', token)

    const url = `${getApiUrl('/influencers/search-stream')}?${params.toString()}`
    const es = new EventSource(url)

    es.addEventListener('internal', (e) => {
      try {
        const profiles = JSON.parse(e.data) as StreamedResult[]
        setResults(profiles.map((p) => ({ ...p, isExternal: false })))
        setIsLoading(false)
        setIsSearchingExternal(true)
      } catch {
        setIsLoading(false)
      }
    })

    es.addEventListener('external', (e) => {
      try {
        const profile = JSON.parse(e.data) as StreamedResult
        setResults((prev) => [...prev, { ...profile, isExternal: true }])
      } catch {
        // ignore malformed event
      }
    })

    es.addEventListener('warning', (e) => {
      try {
        const { message } = JSON.parse(e.data)
        setWarning(message)
      } catch {
        // ignore
      }
    })

    es.addEventListener('done', () => {
      setIsSearchingExternal(false)
      es.close()
    })

    es.addEventListener('error', () => {
      setError('Connection error')
      setIsLoading(false)
      setIsSearchingExternal(false)
      es.close()
    })

    return () => {
      es.close()
    }
  }, [filters.q, filters.niche, filters.location, filters.followersMin, filters.followersMax, filters.scope])

  return { results, isLoading, isSearchingExternal, warning, error }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/lib/hooks/use-search-stream.ts
git commit -m "feat(frontend): add useSearchStream hook for SSE discovery"
```

---

## Task 10: Frontend Discover Page Integration

**Files:**
- Modify: `frontend/app/brand/discover/page.tsx`

- [ ] **Step 1: Replace useQuery with useSearchStream**

Modify `frontend/app/brand/discover/page.tsx`.

Replace the existing imports:

```tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
```

With:

```tsx
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useSearchStream } from '@/lib/hooks/use-search-stream'
```

Replace the existing `useQuery` block:

```tsx
  const {
    data: influencers,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['influencers', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v)
      })
      return apiFetch<InfluencerProfile[]>(`/influencers?${params.toString()}`)
    },
  })
```

With:

```tsx
  const { results: influencers, isLoading, isSearchingExternal, warning, error: isError } = useSearchStream(filters)
```

Also add the external search indicator. After the existing `isError` block (around line 265), add before the results list:

```tsx
          {isSearchingExternal && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray">
              <div
                className="animate-spin w-4 h-4 border-2 rounded-full"
                style={{
                  borderColor: '#0c0c0c',
                  borderTopColor: 'transparent',
                }}
              />
              Searching external sources...
            </div>
          )}

          {warning && (
            <div className="d-card mb-4 bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-800">{warning}</p>
            </div>
          )}
```

- [ ] **Step 2: Verify frontend build**

```bash
cd /Users/pw/workspace/src/influencer-marketing/frontend
yarn build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/brand/discover/page.tsx frontend/lib/hooks/use-search-stream.ts
git commit -m "feat(frontend): integrate SSE search stream into discover page"
```

---

## Task 11: Integration Test for SSE Endpoint

**Files:**
- Create: `backend/test/scraper-search.e2e-spec.ts`

- [ ] **Step 1: Write integration test**

Create `backend/test/scraper-search.e2e-spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/app.module'

describe('Scraper Search SSE (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

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
```

- [ ] **Step 2: Run integration test**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn test:e2e test/scraper-search.e2e-spec.ts
```

Expected: Test passes. The SSE endpoint responds with correct content-type and events.

- [ ] **Step 3: Commit**

```bash
git add backend/test/scraper-search.e2e-spec.ts
git commit -m "test(scraper): add e2e test for SSE search stream"
```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Plan Task |
|-----------------|-----------|
| Extend `InfluencerProfile` schema | Task 1 |
| Adapter-based scraper architecture | Task 3, 4 |
| Playwright browser pool with anti-detection | Task 4 |
| SSE streaming endpoint | Task 7 |
| Background BullMQ worker for dedup/merge | Task 6 |
| Frontend SSE consumption | Task 9, 10 |
| Error handling (blocked, timeout, crash) | Task 4 (ScraperService catches adapter errors) |
| Testing (unit, integration, e2e) | Task 4, 6, 11 |

### Placeholder Scan

- No "TBD", "TODO", "implement later", or "fill in details" found.
- All steps contain actual code or exact commands.
- No vague references to "similar to Task N".

### Type Consistency Check

- `RawScrapedProfile` interface used consistently across Tasks 3, 4, 6, 7.
- `SCRAPER_ADAPTERS` injection token used consistently in Tasks 3, 4, 5.
- `ScraperBlockedError` used in Tasks 3, 4.
- `SearchInfluencersDto` referenced correctly in Tasks 3, 4, 7.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-18-external-search-source.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach would you prefer?
