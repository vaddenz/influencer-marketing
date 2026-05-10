import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
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

    const profile = await this.prisma.brandProfile.create({
      data: {
        ...dto,
        userId,
      },
    })

    this.logger.log(`Brand profile created for user ${userId}`)
    return profile
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
    const profile = await this.prisma.brandProfile.update({
      where: { userId },
      data: dto,
    })

    this.logger.log(`Brand profile updated for user ${userId}`)
    return profile
  }

  async getPublicProfile(userId: string) {
    const profile = await this.prisma.brandProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
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
