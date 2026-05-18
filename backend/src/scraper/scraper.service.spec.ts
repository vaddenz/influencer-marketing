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

    await new Promise<void>((resolve, reject) => {
      result$.subscribe({
        next: (r) => results.push(r),
        error: (err) => reject(err),
        complete: () => {
          expect(results).toHaveLength(1)
          expect(results[0].name).toBe('Test User')
          resolve()
        },
      })
    })
  })

  it('should skip adapters that throw blocked error', async () => {
    jest.spyOn(mockAdapter, 'scrape').mockImplementation(async function* () {
      throw new ScraperBlockedError('test-site', 'https://test.com')
    })

    const result$ = await service.scrape({ q: 'test' } as any)
    const results: any[] = []

    await new Promise<void>((resolve, reject) => {
      result$.subscribe({
        next: (r) => results.push(r),
        error: (err) => reject(err),
        complete: () => {
          expect(results).toHaveLength(0)
          resolve()
        },
      })
    })
  })
})
