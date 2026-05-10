import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { DeliverablesService } from './deliverables.service'
import { PrismaService } from '@/common/prisma/prisma.service'
import { Role } from '@/common/enums/role.enum'
import type { UserPayload } from '@/common/decorators/current-user.decorator'

const mockPrismaService = () => {
  const prisma = {
    deliverable: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  }
  prisma.$transaction = jest.fn((arg: unknown) => {
    if (typeof arg === 'function') {
      return (arg as (tx: typeof prisma) => Promise<unknown>)(prisma)
    }
    return Promise.all((arg as Promise<unknown>[]).map((op) => op))
  })
  return prisma
}

describe('DeliverablesService', () => {
  let service: DeliverablesService
  let prisma: ReturnType<typeof mockPrismaService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliverablesService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile()

    service = module.get<DeliverablesService>(DeliverablesService)
    prisma = module.get(PrismaService)
  })

  describe('findAll', () => {
    it('should return brand-owned deliverables for brand role', async () => {
      const user: UserPayload = {
        id: 'brand-1',
        email: 'b@example.com',
        role: Role.Brand,
      }
      const campaignId = 'camp-1'
      const deliverables = [
        {
          id: 'del-1',
          campaignId,
          influencerId: 'inf-1',
          description: 'Post 1',
          dueDate: null,
          status: 'pending',
          completedAt: null,
          createdAt: new Date(),
        },
      ]

      prisma.deliverable.findMany.mockResolvedValue(deliverables)

      await expect(service.findAll(user, campaignId)).resolves.toEqual(
        deliverables
      )
      expect(prisma.deliverable.findMany).toHaveBeenCalledWith({
        where: {
          campaign: {
            brandId: user.id,
          },
          campaignId,
        },
        select: {
          id: true,
          campaignId: true,
          influencerId: true,
          description: true,
          dueDate: true,
          status: true,
          completedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return influencer deliverables for influencer role', async () => {
      const user: UserPayload = {
        id: 'inf-1',
        email: 'i@example.com',
        role: Role.Influencer,
      }
      const campaignId = 'camp-1'
      const deliverables = [
        {
          id: 'del-1',
          campaignId,
          influencerId: user.id,
          description: 'Post 1',
          dueDate: null,
          status: 'pending',
          completedAt: null,
          createdAt: new Date(),
        },
      ]

      prisma.deliverable.findMany.mockResolvedValue(deliverables)

      await expect(service.findAll(user, campaignId)).resolves.toEqual(
        deliverables
      )
      expect(prisma.deliverable.findMany).toHaveBeenCalledWith({
        where: {
          influencerId: user.id,
          campaignId,
        },
        select: {
          id: true,
          campaignId: true,
          influencerId: true,
          description: true,
          dueDate: true,
          status: true,
          completedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('complete', () => {
    it('should complete deliverable and notify brand when all are done', async () => {
      const userId = 'inf-1'
      const deliverableId = 'del-1'
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        title: 'Summer',
      }
      const deliverable = {
        id: deliverableId,
        campaignId: campaign.id,
        influencerId: userId,
        status: 'pending',
        campaign,
      }
      const updated = {
        id: deliverableId,
        campaignId: campaign.id,
        influencerId: userId,
        status: 'completed',
        completedAt: expect.any(Date),
      }

      prisma.deliverable.findUnique.mockResolvedValue(deliverable)
      prisma.deliverable.update.mockResolvedValue(updated)
      prisma.deliverable.count.mockResolvedValue(0)
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' })

      await expect(service.complete(userId, deliverableId)).resolves.toEqual(
        updated
      )
      expect(prisma.deliverable.update).toHaveBeenCalledWith({
        where: { id: deliverableId },
        data: {
          status: 'completed',
          completedAt: expect.any(Date),
        },
      })
      expect(prisma.deliverable.count).toHaveBeenCalledWith({
        where: {
          campaignId: campaign.id,
          influencerId: userId,
          status: {
            not: 'completed',
          },
        },
      })
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: campaign.brandId,
          type: 'deliverables_completed',
          title: 'Deliverables completed',
          message: `All deliverables for campaign "${campaign.title}" have been completed`,
          relatedEntityType: 'campaign',
          relatedEntityId: campaign.id,
        },
      })
    })

    it('should complete deliverable without notification when more remain', async () => {
      const userId = 'inf-1'
      const deliverableId = 'del-1'
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        title: 'Summer',
      }
      const deliverable = {
        id: deliverableId,
        campaignId: campaign.id,
        influencerId: userId,
        status: 'pending',
        campaign,
      }
      const updated = {
        id: deliverableId,
        status: 'completed',
        completedAt: expect.any(Date),
      }

      prisma.deliverable.findUnique.mockResolvedValue(deliverable)
      prisma.deliverable.update.mockResolvedValue(updated)
      prisma.deliverable.count.mockResolvedValue(2)

      await expect(service.complete(userId, deliverableId)).resolves.toEqual(
        updated
      )
      expect(prisma.notification.create).not.toHaveBeenCalled()
    })

    it('should return deliverable as-is if already completed', async () => {
      const userId = 'inf-1'
      const deliverableId = 'del-1'
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        title: 'Summer',
      }
      const deliverable = {
        id: deliverableId,
        campaignId: campaign.id,
        influencerId: userId,
        status: 'completed',
        completedAt: new Date(),
        campaign,
      }

      prisma.deliverable.findUnique.mockResolvedValue(deliverable)

      await expect(service.complete(userId, deliverableId)).resolves.toEqual(
        deliverable
      )
      expect(prisma.deliverable.update).not.toHaveBeenCalled()
      expect(prisma.notification.create).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException if deliverable does not exist', async () => {
      prisma.deliverable.findUnique.mockResolvedValue(null)

      await expect(service.complete('inf-1', 'del-1')).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ForbiddenException if influencer does not own deliverable', async () => {
      prisma.deliverable.findUnique.mockResolvedValue({
        id: 'del-1',
        campaignId: 'camp-1',
        influencerId: 'inf-2',
        status: 'pending',
        campaign: { id: 'camp-1', brandId: 'brand-1', title: 'Summer' },
      })

      await expect(service.complete('inf-1', 'del-1')).rejects.toThrow(
        ForbiddenException
      )
    })
  })

  describe('reopen', () => {
    it('should reopen deliverable when brand owns campaign', async () => {
      const userId = 'brand-1'
      const deliverableId = 'del-1'
      const campaign = {
        id: 'camp-1',
        brandId: userId,
        title: 'Summer',
      }
      const deliverable = {
        id: deliverableId,
        campaignId: campaign.id,
        influencerId: 'inf-1',
        status: 'completed',
        campaign,
      }
      const updated = {
        id: deliverableId,
        status: 'pending',
        completedAt: null,
      }

      prisma.deliverable.findUnique.mockResolvedValue(deliverable)
      prisma.deliverable.update.mockResolvedValue(updated)

      await expect(service.reopen(userId, deliverableId)).resolves.toEqual(
        updated
      )
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(prisma.deliverable.update).toHaveBeenCalledWith({
        where: { id: deliverableId },
        data: {
          status: 'pending',
          completedAt: null,
        },
      })
    })

    it('should throw NotFoundException if deliverable does not exist', async () => {
      prisma.deliverable.findUnique.mockResolvedValue(null)

      await expect(service.reopen('brand-1', 'del-1')).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ForbiddenException if brand does not own campaign', async () => {
      prisma.deliverable.findUnique.mockResolvedValue({
        id: 'del-1',
        campaignId: 'camp-1',
        influencerId: 'inf-1',
        status: 'completed',
        campaign: { id: 'camp-1', brandId: 'brand-2', title: 'Summer' },
      })

      await expect(service.reopen('brand-1', 'del-1')).rejects.toThrow(
        ForbiddenException
      )
    })
  })
})
