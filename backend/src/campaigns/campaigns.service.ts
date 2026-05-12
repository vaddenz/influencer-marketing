import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'
import { Role } from '@/common/enums/role.enum'
import type { UserPayload } from '@/common/decorators/current-user.decorator'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'

const CAMPAIGN_LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  budget: true,
  startDate: true,
  endDate: true,
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCampaignDto) {
    const brandProfile = await this.prisma.brandProfile.findUnique({
      where: { userId },
    })

    if (!brandProfile) {
      throw new ForbiddenException('Brand profile required to create campaigns')
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        ...dto,
        brandId: userId,
      },
    })

    this.logger.log(`Campaign created by brand ${userId}: ${campaign.id}`)
    return campaign
  }

  async findAll(user: UserPayload) {
    if (user.role === Role.Brand) {
      return this.prisma.campaign.findMany({
        where: { brandId: user.id },
        select: CAMPAIGN_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
      })
    }

    // Influencer: campaigns where they have an accepted invitation
    return this.prisma.campaign.findMany({
      where: {
        invitations: {
          some: {
            influencerId: user.id,
            status: 'accepted',
          },
        },
      },
      select: CAMPAIGN_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(user: UserPayload, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        invitations: {
          include: {
            influencer: {
              select: {
                id: true,
                name: true,
                email: true,
                influencerProfile: true,
              },
            },
          },
        },
        deliverables: true,
        sop: true,
      },
    })

    if (!campaign) {
      throw new NotFoundException('Campaign not found')
    }

    const isBrandOwner = campaign.brandId === user.id
    const isInvitedInfluencer = campaign.invitations.some(
      (inv) => inv.influencerId === user.id && inv.status === 'accepted'
    )

    if (!isBrandOwner && !isInvitedInfluencer) {
      throw new ForbiddenException('You do not have access to this campaign')
    }

    // For influencers, scope deliverables and invitations to only theirs
    if (user.role === Role.Influencer) {
      return {
        ...campaign,
        invitations: campaign.invitations.filter(
          (inv) => inv.influencerId === user.id
        ),
        deliverables: campaign.deliverables.filter(
          (del) => del.influencerId === user.id
        ),
      }
    }

    return campaign
  }

  async update(userId: string, campaignId: string, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      throw new NotFoundException('Campaign not found')
    }

    if (campaign.brandId !== userId) {
      throw new ForbiddenException('You do not have access to this campaign')
    }

    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: dto,
    })

    this.logger.log(`Campaign updated by brand ${userId}: ${campaignId}`)
    return updated
  }

  async remove(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      throw new NotFoundException('Campaign not found')
    }

    if (campaign.brandId !== userId) {
      throw new ForbiddenException('You do not have access to this campaign')
    }

    await this.prisma.campaign.delete({
      where: { id: campaignId },
    })

    this.logger.log(`Campaign deleted by brand ${userId}: ${campaignId}`)
  }
}
