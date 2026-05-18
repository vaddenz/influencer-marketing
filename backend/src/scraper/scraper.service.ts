import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Browser, BrowserContext, chromium } from 'playwright'
import { Observable, Subject } from 'rxjs'
import { Inject } from '@nestjs/common'
import { SCRAPER_ADAPTERS, ScraperAdapter } from './interfaces/scraper-adapter.interface'
import { RawScrapedProfile } from './dto/raw-scraped-profile.dto'
import { ScraperBlockedError } from './exceptions/scraper-blocked.error'

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
