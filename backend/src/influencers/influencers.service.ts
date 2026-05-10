import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@/generated/prisma/client'
import { PrismaService } from '@/common/prisma/prisma.service'
import { CreateInfluencerProfileDto } from './dto/create-influencer-profile.dto'
import { UpdateInfluencerProfileDto } from './dto/update-influencer-profile.dto'
import { SearchInfluencersDto } from './dto/search-influencers.dto'

@Injectable()
export class InfluencersService {
  private readonly logger = new Logger(InfluencersService.name)

  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateInfluencerProfileDto) {
    const existing = await this.prisma.influencerProfile.findUnique({
      where: { userId },
    })

    if (existing) {
      throw new ConflictException('Influencer profile already exists')
    }

    try {
      const profile = await this.prisma.influencerProfile.create({
        data: {
          ...dto,
          platforms: dto.platforms as unknown as Prisma.InputJsonValue,
          userId,
        },
      })

      this.logger.log(`Influencer profile created for user ${userId}`)
      return profile
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Influencer profile already exists')
      }
      throw error
    }
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.influencerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      throw new NotFoundException('Influencer profile not found')
    }

    return profile
  }

  async updateProfile(userId: string, dto: UpdateInfluencerProfileDto) {
    const profile = await this.prisma.influencerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      throw new NotFoundException('Influencer profile not found')
    }

    const updated = await this.prisma.influencerProfile.update({
      where: { userId },
      data: {
        ...dto,
        platforms: dto.platforms ? (dto.platforms as unknown as Prisma.InputJsonValue) : undefined,
      },
    })

    this.logger.log(`Influencer profile updated for user ${userId}`)
    return updated
  }

  async getPublicProfile(userId: string) {
    const profile = await this.prisma.influencerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!profile) {
      throw new NotFoundException('Influencer profile not found')
    }

    return profile
  }

  async search(dto: SearchInfluencersDto) {
    const where: Prisma.InfluencerProfileWhereInput = {}

    if (dto.q) {
      where.OR = [
        { displayName: { contains: dto.q, mode: 'insensitive' } },
        { handle: { contains: dto.q, mode: 'insensitive' } },
        { bio: { contains: dto.q, mode: 'insensitive' } },
      ]
    }

    if (dto.niche) {
      where.niche = { equals: dto.niche, mode: 'insensitive' }
    }

    if (dto.location) {
      where.locationCountry = { equals: dto.location, mode: 'insensitive' }
    }

    if (dto.region) {
      where.locationRegion = { equals: dto.region, mode: 'insensitive' }
    }

    const followerConditions: Prisma.IntFilter<'InfluencerProfile'>[] = []

    if (dto.followersMin !== undefined) {
      followerConditions.push({ gte: dto.followersMin })
    }

    if (dto.followersMax !== undefined) {
      followerConditions.push({ lte: dto.followersMax })
    }

    if (dto.scope) {
      const ranges: Record<string, [number, number | undefined]> = {
        nano: [1000, 10000],
        micro: [10000, 100000],
        macro: [100000, 1000000],
        mega: [1000000, undefined],
      }
      const [min, max] = ranges[dto.scope]
      followerConditions.push({ gte: min })
      if (max !== undefined) {
        followerConditions.push({ lte: max })
      }
    }

    if (followerConditions.length > 0) {
      if (followerConditions.length === 1) {
        where.followerCount = followerConditions[0]
      } else {
        where.AND = where.AND
          ? [...(Array.isArray(where.AND) ? where.AND : [where.AND]), ...followerConditions.map((cond) => ({ followerCount: cond }))]
          : followerConditions.map((cond) => ({ followerCount: cond }))
      }
    }

    const candidates = await this.prisma.influencerProfile.findMany({
      where,
      orderBy: { followerCount: 'desc' },
    })

    if (!dto.platforms) {
      return candidates
    }

    const platformNames = dto.platforms
      .split(',')
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean)

    if (platformNames.length === 0) {
      return candidates
    }

    const filtered = candidates.filter((candidate) => {
      const platforms = Array.isArray(candidate.platforms)
        ? (candidate.platforms as Array<{ platform: string }>)
        : []
      return platforms.some((plat) =>
        platformNames.includes(String(plat.platform).toLowerCase()),
      )
    })

    return filtered
  }
}
