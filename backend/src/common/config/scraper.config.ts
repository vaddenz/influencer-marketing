import { registerAs } from '@nestjs/config'

export default registerAs('scraper', () => ({
  proxyPool: process.env.SCRAPER_PROXY_POOL?.split(',') || [],
  minRequestInterval: parseInt(process.env.SCRAPER_MIN_INTERVAL || '3000', 10),
  scrapeTimeout: parseInt(process.env.SCRAPER_TIMEOUT || '30000', 10),
  maxConcurrentAdapters: parseInt(process.env.SCRAPER_MAX_CONCURRENT || '3', 10),
}))
