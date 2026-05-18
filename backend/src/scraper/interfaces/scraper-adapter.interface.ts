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
