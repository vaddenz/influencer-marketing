import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@/generated/prisma/client'
import { PrismaService } from '@/common/prisma/prisma.service'
import { CreateBrandProfileDto } from './dto/create-brand-profile.dto'
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto'

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateBrandProfileDto) {
    const existing = await this.prisma.brandProfile.findUnique({
      where: { userId },
    })

    if (existing) {
      throw new ConflictException('Brand profile already exists')
    }

    try {
      const profile = await this.prisma.brandProfile.create({
        data: {
          ...dto,
          userId,
        },
      })

      this.logger.log(`Brand profile created for user ${userId}`)
      return profile
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Brand profile already exists')
      }
      throw error
    }
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.brandProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      throw new NotFoundException('Brand profile not found')
    }

    return profile
  }

  async updateProfile(userId: string, dto: UpdateBrandProfileDto) {
    const profile = await this.prisma.brandProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      throw new NotFoundException('Brand profile not found')
    }

    const updated = await this.prisma.brandProfile.update({
      where: { userId },
      data: dto,
    })

    this.logger.log(`Brand profile updated for user ${userId}`)
    return updated
  }

  async getPublicProfile(userId: string) {
    const profile = await this.prisma.brandProfile.findUnique({
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
      throw new NotFoundException('Brand profile not found')
    }

    return profile
  }
}
