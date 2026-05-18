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
