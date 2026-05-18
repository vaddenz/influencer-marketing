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
