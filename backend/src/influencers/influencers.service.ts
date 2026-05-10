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

const SCOPE_RANGES: Record<string, { min: number; max?: number }> = {
  nano: { min: 1000, max: 10000 },
  micro: { min: 10000, max: 100000 },
  macro: { min: 100000, max: 1000000 },
  mega: { min: 1000000, max: undefined },
}

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
    const andConditions: Prisma.InfluencerProfileWhereInput[] = []

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

    if (dto.followersMin !== undefined) {
      andConditions.push({ followerCount: { gte: dto.followersMin } })
    }

    if (dto.followersMax !== undefined) {
      andConditions.push({ followerCount: { lte: dto.followersMax } })
    }

    if (dto.scope) {
      const range = SCOPE_RANGES[dto.scope]
      if (range) {
        andConditions.push({ followerCount: { gte: range.min } })
        if (range.max !== undefined) {
          andConditions.push({ followerCount: { lte: range.max } })
        }
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    const skip = ((dto.page ?? 1) - 1) * (dto.limit ?? 20)
    const take = dto.limit ?? 20

    const candidates = await this.prisma.influencerProfile.findMany({
      where,
      orderBy: { followerCount: 'desc' },
      skip,
      take,
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
