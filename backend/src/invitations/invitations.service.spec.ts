import { Test, TestingModule } from '@nestjs/testing'
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { InvitationsService } from './invitations.service'
import { PrismaService } from '@/common/prisma/prisma.service'
import { Role } from '@/common/enums/role.enum'
import type { UserPayload } from '@/common/decorators/current-user.decorator'

const mockPrismaService = () => {
  const prisma = {
    campaign: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    invitation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    deliverable: {
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

describe('InvitationsService', () => {
  let service: InvitationsService
  let prisma: ReturnType<typeof mockPrismaService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile()

    service = module.get<InvitationsService>(InvitationsService)
    prisma = module.get(PrismaService)
  })

  describe('create', () => {
    it('should create an invitation and notify influencer when brand owns campaign', async () => {
      const userId = 'brand-1'
      const dto = {
        campaignId: 'camp-1',
        influencerId: 'inf-1',
        message: 'Join us!',
      }
      const campaign = { id: 'camp-1', brandId: userId, title: 'Summer' }
      const invitation = {
        id: 'inv-1',
        campaignId: dto.campaignId,
        influencerId: dto.influencerId,
        status: 'pending',
        message: dto.message,
      }

      prisma.campaign.findUnique.mockResolvedValue(campaign)
      prisma.user.findUnique.mockResolvedValue({
        id: dto.influencerId,
        influencerProfile: { id: 'profile-1' },
      })
      prisma.invitation.create.mockResolvedValue(invitation)
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' })

      await expect(service.create(userId, dto)).resolves.toEqual(invitation)
      expect(prisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: dto.campaignId },
      })
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: dto.influencerId },
        include: { influencerProfile: true },
      })
      expect(prisma.invitation.create).toHaveBeenCalledWith({
        data: {
          campaignId: dto.campaignId,
          influencerId: dto.influencerId,
          message: dto.message,
        },
      })
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: dto.influencerId,
          type: 'invitation_received',
          title: 'New Invitation',
          message: `You have been invited to collaborate on "${campaign.title}"`,
          relatedEntityType: 'invitation',
          relatedEntityId: invitation.id,
        },
      })
    })

    it('should throw NotFoundException if campaign does not exist', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null)

      await expect(
        service.create('brand-1', {
          campaignId: 'camp-1',
          influencerId: 'inf-1',
        }),
      ).rejects.toThrow(NotFoundException)
      expect(prisma.invitation.create).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenException if brand does not own campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue({
        id: 'camp-1',
        brandId: 'brand-2',
        title: 'Summer',
      })

      await expect(
        service.create('brand-1', {
          campaignId: 'camp-1',
          influencerId: 'inf-1',
        }),
      ).rejects.toThrow(ForbiddenException)
      expect(prisma.invitation.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException if a pending invitation already exists', async () => {
      const userId = 'brand-1'
      const dto = {
        campaignId: 'camp-1',
        influencerId: 'inf-1',
        message: 'Join us!',
      }
      const campaign = { id: 'camp-1', brandId: userId, title: 'Summer' }
      const existing = { id: 'inv-existing', status: 'pending' }

      prisma.campaign.findUnique.mockResolvedValue(campaign)
      prisma.invitation.findFirst.mockResolvedValue(existing)

      await expect(service.create(userId, dto)).rejects.toThrow(
        ConflictException,
      )
      expect(prisma.invitation.findFirst).toHaveBeenCalledWith({
        where: {
          campaignId: dto.campaignId,
          influencerId: dto.influencerId,
          status: 'pending',
        },
      })
      expect(prisma.invitation.create).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException if influencer does not exist', async () => {
      const userId = 'brand-1'
      const dto = {
        campaignId: 'camp-1',
        influencerId: 'inf-1',
        message: 'Join us!',
      }
      const campaign = { id: 'camp-1', brandId: userId, title: 'Summer' }

      prisma.campaign.findUnique.mockResolvedValue(campaign)
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.create(userId, dto)).rejects.toThrow(
        NotFoundException,
      )
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: dto.influencerId },
        include: { influencerProfile: true },
      })
      expect(prisma.invitation.create).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException if influencer has no influencerProfile', async () => {
      const userId = 'brand-1'
      const dto = {
        campaignId: 'camp-1',
        influencerId: 'inf-1',
        message: 'Join us!',
      }
      const campaign = { id: 'camp-1', brandId: userId, title: 'Summer' }

      prisma.campaign.findUnique.mockResolvedValue(campaign)
      prisma.user.findUnique.mockResolvedValue({
        id: dto.influencerId,
        influencerProfile: null,
      })

      await expect(service.create(userId, dto)).rejects.toThrow(
        NotFoundException,
      )
      expect(prisma.invitation.create).not.toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('should return brand-owned invitations for brand role', async () => {
      const user: UserPayload = {
        id: 'brand-1',
        email: 'b@example.com',
        role: Role.Brand,
      }
      const invitations = [
        {
          id: 'inv-1',
          campaignId: 'camp-1',
          influencerId: 'inf-1',
          status: 'pending',
          message: null,
          createdAt: new Date(),
          respondedAt: null,
          campaign: {
            title: 'Summer',
            brand: {
              brandProfile: {
                companyName: 'Acme Inc',
              },
            },
          },
        },
      ]

      prisma.invitation.findMany.mockResolvedValue(invitations)

      await expect(service.findAll(user)).resolves.toEqual(invitations)
      expect(prisma.invitation.findMany).toHaveBeenCalledWith({
        where: {
          campaign: {
            brandId: user.id,
          },
        },
        select: {
          id: true,
          campaignId: true,
          influencerId: true,
          status: true,
          message: true,
          createdAt: true,
          respondedAt: true,
          campaign: {
            select: {
              title: true,
              brand: {
                select: {
                  brandProfile: {
                    select: { companyName: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return received invitations for influencer role', async () => {
      const user: UserPayload = {
        id: 'inf-1',
        email: 'i@example.com',
        role: Role.Influencer,
      }
      const invitations = [
        {
          id: 'inv-1',
          campaignId: 'camp-1',
          influencerId: user.id,
          status: 'pending',
          message: null,
          createdAt: new Date(),
          respondedAt: null,
          campaign: {
            title: 'Summer',
            brand: {
              brandProfile: {
                companyName: 'Acme Inc',
              },
            },
          },
        },
      ]

      prisma.invitation.findMany.mockResolvedValue(invitations)

      await expect(service.findAll(user)).resolves.toEqual(invitations)
      expect(prisma.invitation.findMany).toHaveBeenCalledWith({
        where: {
          influencerId: user.id,
        },
        select: {
          id: true,
          campaignId: true,
          influencerId: true,
          status: true,
          message: true,
          createdAt: true,
          respondedAt: true,
          campaign: {
            select: {
              title: true,
              brand: {
                select: {
                  brandProfile: {
                    select: { companyName: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('accept', () => {
    it('should accept pending invitation, notify brand, and create deliverable', async () => {
      const userId = 'inf-1'
      const invitationId = 'inv-1'
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        title: 'Summer',
        description: 'Promote summer products',
      }
      const invitation = {
        id: invitationId,
        campaignId: campaign.id,
        influencerId: userId,
        status: 'pending',
        campaign,
      }
      const updated = {
        id: invitationId,
        status: 'accepted',
        respondedAt: expect.any(Date),
      }

      prisma.invitation.findUnique.mockResolvedValue(invitation)
      prisma.invitation.update.mockResolvedValue(updated)
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      prisma.deliverable.create.mockResolvedValue({ id: 'del-1' })

      await expect(service.accept(userId, invitationId)).resolves.toEqual(
        updated,
      )
      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: invitationId },
        data: {
          status: 'accepted',
          respondedAt: expect.any(Date),
        },
      })
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: campaign.brandId,
          type: 'invitation_accepted',
          title: 'Invitation Accepted',
          message: `An influencer has accepted your invitation for "${campaign.title}"`,
          relatedEntityType: 'invitation',
          relatedEntityId: invitation.id,
        },
      })
      expect(prisma.deliverable.create).toHaveBeenCalledWith({
        data: {
          campaignId: campaign.id,
          influencerId: userId,
          description: campaign.description,
          status: 'pending',
        },
      })
    })

    it('should use default description when campaign description is empty', async () => {
      const userId = 'inf-1'
      const invitationId = 'inv-1'
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        title: 'Summer',
        description: '',
      }
      const invitation = {
        id: invitationId,
        campaignId: campaign.id,
        influencerId: userId,
        status: 'pending',
        campaign,
      }

      prisma.invitation.findUnique.mockResolvedValue(invitation)
      prisma.invitation.update.mockResolvedValue({ id: invitationId })
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      prisma.deliverable.create.mockResolvedValue({ id: 'del-1' })

      await service.accept(userId, invitationId)
      expect(prisma.deliverable.create).toHaveBeenCalledWith({
        data: {
          campaignId: campaign.id,
          influencerId: userId,
          description: 'Complete campaign deliverables',
          status: 'pending',
        },
      })
    })

    it('should throw NotFoundException if invitation does not exist', async () => {
      prisma.invitation.findUnique.mockResolvedValue(null)

      await expect(service.accept('inf-1', 'inv-1')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw ForbiddenException if influencer does not own invitation', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        influencerId: 'inf-2',
        status: 'pending',
        campaign: { id: 'camp-1', brandId: 'brand-1', title: 'Summer' },
      })

      await expect(service.accept('inf-1', 'inv-1')).rejects.toThrow(
        ForbiddenException,
      )
    })

    it('should throw BadRequestException if invitation is not pending', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        influencerId: 'inf-1',
        status: 'accepted',
        campaign: { id: 'camp-1', brandId: 'brand-1', title: 'Summer' },
      })

      await expect(service.accept('inf-1', 'inv-1')).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('decline', () => {
    it('should decline pending invitation and notify brand', async () => {
      const userId = 'inf-1'
      const invitationId = 'inv-1'
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        title: 'Summer',
      }
      const invitation = {
        id: invitationId,
        campaignId: campaign.id,
        influencerId: userId,
        status: 'pending',
        campaign,
      }
      const updated = {
        id: invitationId,
        status: 'declined',
        respondedAt: expect.any(Date),
      }

      prisma.invitation.findUnique.mockResolvedValue(invitation)
      prisma.invitation.update.mockResolvedValue(updated)
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' })

      await expect(service.decline(userId, invitationId)).resolves.toEqual(
        updated,
      )
      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: invitationId },
        data: {
          status: 'declined',
          respondedAt: expect.any(Date),
        },
      })
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: campaign.brandId,
          type: 'invitation_declined',
          title: 'Invitation Declined',
          message: `An influencer has declined your invitation for "${campaign.title}"`,
          relatedEntityType: 'invitation',
          relatedEntityId: invitation.id,
        },
      })
    })

    it('should throw BadRequestException if invitation is not pending', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        influencerId: 'inf-1',
        status: 'declined',
        campaign: { id: 'camp-1', brandId: 'brand-1', title: 'Summer' },
      })

      await expect(service.decline('inf-1', 'inv-1')).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('withdraw', () => {
    it('should withdraw pending invitation when brand owns campaign', async () => {
      const userId = 'brand-1'
      const invitationId = 'inv-1'
      const campaign = {
        id: 'camp-1',
        brandId: userId,
        title: 'Summer',
      }
      const invitation = {
        id: invitationId,
        campaignId: campaign.id,
        influencerId: 'inf-1',
        status: 'pending',
        campaign,
      }
      const updated = {
        id: invitationId,
        status: 'withdrawn',
        respondedAt: expect.any(Date),
      }

      prisma.invitation.findUnique.mockResolvedValue(invitation)
      prisma.invitation.update.mockResolvedValue(updated)

      await expect(service.withdraw(userId, invitationId)).resolves.toEqual(
        updated,
      )
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: invitationId },
        data: {
          status: 'withdrawn',
          respondedAt: expect.any(Date),
        },
      })
    })

    it('should throw ForbiddenException if brand does not own campaign', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        campaignId: 'camp-1',
        influencerId: 'inf-1',
        status: 'pending',
        campaign: { id: 'camp-1', brandId: 'brand-2', title: 'Summer' },
      })

      await expect(service.withdraw('brand-1', 'inv-1')).rejects.toThrow(
        ForbiddenException,
      )
    })

    it('should throw BadRequestException if invitation is not pending', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        campaignId: 'camp-1',
        influencerId: 'inf-1',
        status: 'accepted',
        campaign: { id: 'camp-1', brandId: 'brand-1', title: 'Summer' },
      })

      await expect(service.withdraw('brand-1', 'inv-1')).rejects.toThrow(
        BadRequestException,
      )
    })
  })
})
