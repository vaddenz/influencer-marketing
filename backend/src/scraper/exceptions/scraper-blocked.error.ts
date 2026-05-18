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
