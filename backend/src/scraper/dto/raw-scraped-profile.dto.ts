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
