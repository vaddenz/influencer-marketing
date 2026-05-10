import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'
import { Role } from '@/common/enums/role.enum'
import type { UserPayload } from '@/common/decorators/current-user.decorator'
import { CreateInvitationDto } from './dto/create-invitation.dto'

const INVITATION_LIST_SELECT = {
  id: true,
  campaignId: true,
  influencerId: true,
  status: true,
  message: true,
  createdAt: true,
  respondedAt: true,
}

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateInvitationDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
    })

    if (!campaign) {
      throw new NotFoundException('Campaign not found')
    }

    if (campaign.brandId !== userId) {
      throw new ForbiddenException('You do not own this campaign')
    }

    const invitation = await this.prisma.invitation.create({
      data: {
        campaignId: dto.campaignId,
        influencerId: dto.influencerId,
        message: dto.message,
      },
    })

    await this.prisma.notification.create({
      data: {
        userId: dto.influencerId,
        type: 'invitation_received',
        title: 'New Invitation',
        message: `You have been invited to collaborate on "${campaign.title}"`,
        relatedEntityType: 'invitation',
        relatedEntityId: invitation.id,
      },
    })

    this.logger.log(
      `Invitation ${invitation.id} created by brand ${userId} for influencer ${dto.influencerId}`,
    )
    return invitation
  }

  async findAll(user: UserPayload) {
    if (user.role === Role.Brand) {
      return this.prisma.invitation.findMany({
        where: {
          campaign: {
            brandId: user.id,
          },
        },
        select: INVITATION_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
      })
    }

    return this.prisma.invitation.findMany({
      where: {
        influencerId: user.id,
      },
      select: INVITATION_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    })
  }

  async accept(userId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { campaign: true },
    })

    if (!invitation) {
      throw new NotFoundException('Invitation not found')
    }

    if (invitation.influencerId !== userId) {
      throw new ForbiddenException('You cannot accept this invitation')
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException(
        `Invitation cannot be accepted because it is ${invitation.status}`,
      )
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.invitation.update({
        where: { id: invitationId },
        data: {
          status: 'accepted',
          respondedAt: new Date(),
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: invitation.campaign.brandId,
          type: 'invitation_accepted',
          title: 'Invitation Accepted',
          message: `An influencer has accepted your invitation for "${invitation.campaign.title}"`,
          relatedEntityType: 'invitation',
          relatedEntityId: invitation.id,
        },
      }),
      this.prisma.deliverable.create({
        data: {
          campaignId: invitation.campaignId,
          influencerId: invitation.influencerId,
          description:
            invitation.campaign.description || 'Complete campaign deliverables',
          status: 'pending',
        },
      }),
    ])

    this.logger.log(`Invitation ${invitationId} accepted by influencer ${userId}`)
    return updated
  }

  async decline(userId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { campaign: true },
    })

    if (!invitation) {
      throw new NotFoundException('Invitation not found')
    }

    if (invitation.influencerId !== userId) {
      throw new ForbiddenException('You cannot decline this invitation')
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException(
        `Invitation cannot be declined because it is ${invitation.status}`,
      )
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.invitation.update({
        where: { id: invitationId },
        data: {
          status: 'declined',
          respondedAt: new Date(),
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: invitation.campaign.brandId,
          type: 'invitation_declined',
          title: 'Invitation Declined',
          message: `An influencer has declined your invitation for "${invitation.campaign.title}"`,
          relatedEntityType: 'invitation',
          relatedEntityId: invitation.id,
        },
      }),
    ])

    this.logger.log(`Invitation ${invitationId} declined by influencer ${userId}`)
    return updated
  }

  async withdraw(userId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { campaign: true },
    })

    if (!invitation) {
      throw new NotFoundException('Invitation not found')
    }

    if (invitation.campaign.brandId !== userId) {
      throw new ForbiddenException('You cannot withdraw this invitation')
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException(
        `Invitation cannot be withdrawn because it is ${invitation.status}`,
      )
    }

    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: 'withdrawn',
        respondedAt: new Date(),
      },
    })

    this.logger.log(`Invitation ${invitationId} withdrawn by brand ${userId}`)
    return updated
  }
}
