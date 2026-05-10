import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'
import { Role } from '@/common/enums/role.enum'
import { DeliverableStatus } from '@/generated/prisma/client'
import type { UserPayload } from '@/common/decorators/current-user.decorator'

const DELIVERABLE_LIST_SELECT = {
  id: true,
  campaignId: true,
  influencerId: true,
  description: true,
  dueDate: true,
  status: true,
  completedAt: true,
  createdAt: true,
}

@Injectable()
export class DeliverablesService {
  private readonly logger = new Logger(DeliverablesService.name)

  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: UserPayload, campaignId: string) {
    if (user.role === Role.Brand) {
      return this.prisma.deliverable.findMany({
        where: {
          campaign: {
            brandId: user.id,
          },
          campaignId,
        },
        select: DELIVERABLE_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
      })
    }

    return this.prisma.deliverable.findMany({
      where: {
        influencerId: user.id,
        campaignId,
      },
      select: DELIVERABLE_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    })
  }

  async complete(userId: string, deliverableId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const deliverable = await tx.deliverable.findUnique({
        where: { id: deliverableId },
        include: { campaign: true },
      })

      if (!deliverable) {
        throw new NotFoundException('Deliverable not found')
      }

      if (deliverable.influencerId !== userId) {
        throw new ForbiddenException('You cannot complete this deliverable')
      }

      if (deliverable.status === DeliverableStatus.completed) {
        return deliverable
      }

      const updated = await tx.deliverable.update({
        where: { id: deliverableId },
        data: {
          status: DeliverableStatus.completed,
          completedAt: new Date(),
        },
      })

      const remaining = await tx.deliverable.count({
        where: {
          campaignId: deliverable.campaignId,
          influencerId: userId,
          status: {
            not: DeliverableStatus.completed,
          },
        },
      })

      if (remaining === 0) {
        await tx.notification.create({
          data: {
            userId: deliverable.campaign.brandId,
            type: 'deliverables_completed',
            title: 'Deliverables completed',
            message: `All deliverables for campaign "${deliverable.campaign.title}" have been completed`,
            relatedEntityType: 'campaign',
            relatedEntityId: deliverable.campaignId,
          },
        })
      }

      return updated
    })

    this.logger.log(
      `Deliverable ${deliverableId} completed by influencer ${userId}`
    )
    return result
  }

  async reopen(userId: string, deliverableId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const deliverable = await tx.deliverable.findUnique({
        where: { id: deliverableId },
        include: { campaign: true },
      })

      if (!deliverable) {
        throw new NotFoundException('Deliverable not found')
      }

      if (deliverable.campaign.brandId !== userId) {
        throw new ForbiddenException('You cannot reopen this deliverable')
      }

      return tx.deliverable.update({
        where: { id: deliverableId },
        data: {
          status: DeliverableStatus.pending,
          completedAt: null,
        },
      })
    })

    this.logger.log(`Deliverable ${deliverableId} reopened by brand ${userId}`)
    return updated
  }
}
