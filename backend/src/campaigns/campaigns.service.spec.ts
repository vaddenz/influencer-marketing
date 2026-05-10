import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { CampaignsService } from './campaigns.service'
import { PrismaService } from '@/common/prisma/prisma.service'
import { Role } from '@/common/enums/role.enum'
import type { UserPayload } from '@/common/decorators/current-user.decorator'

const mockPrismaService = () => ({
  brandProfile: {
    findUnique: jest.fn(),
  },
  campaign: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
})

describe('CampaignsService', () => {
  let service: CampaignsService
  let prisma: ReturnType<typeof mockPrismaService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile()

    service = module.get<CampaignsService>(CampaignsService)
    prisma = module.get(PrismaService)
  })

  describe('create', () => {
    it('should create a campaign when brand profile exists', async () => {
      const userId = 'brand-1'
      const dto = {
        title: 'Summer Campaign',
        description: 'Promote summer products',
        budget: '5000',
        startDate: '2025-06-01',
        endDate: '2025-08-31',
      }
      const created = { id: 'camp-1', brandId: userId, ...dto }

      prisma.brandProfile.findUnique.mockResolvedValue({ id: 'bp-1', userId })
      prisma.campaign.create.mockResolvedValue(created)

      await expect(service.create(userId, dto)).resolves.toEqual(created)
      expect(prisma.brandProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      })
      expect(prisma.campaign.create).toHaveBeenCalledWith({
        data: { ...dto, brandId: userId },
      })
    })

    it('should throw ForbiddenException if brand profile does not exist', async () => {
      const userId = 'brand-1'
      const dto = {
        title: 'Summer Campaign',
        description: 'Promote summer products',
      }

      prisma.brandProfile.findUnique.mockResolvedValue(null)

      await expect(service.create(userId, dto)).rejects.toThrow(
        ForbiddenException
      )
      expect(prisma.campaign.create).not.toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('should return brand-owned campaigns for brand role', async () => {
      const user: UserPayload = {
        id: 'brand-1',
        email: 'b@example.com',
        role: Role.Brand,
      }
      const campaigns = [
        {
          id: 'camp-1',
          title: 'A',
          description: 'Desc',
          status: 'draft',
          budget: null,
          startDate: null,
          endDate: null,
        },
      ]

      prisma.campaign.findMany.mockResolvedValue(campaigns)

      await expect(service.findAll(user)).resolves.toEqual(campaigns)
      expect(prisma.campaign.findMany).toHaveBeenCalledWith({
        where: { brandId: user.id },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          budget: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return campaigns with accepted invitations for influencer role', async () => {
      const user: UserPayload = {
        id: 'inf-1',
        email: 'i@example.com',
        role: Role.Influencer,
      }
      const campaigns = [
        {
          id: 'camp-2',
          title: 'B',
          description: 'Desc',
          status: 'active',
          budget: 1000,
          startDate: null,
          endDate: null,
        },
      ]

      prisma.campaign.findMany.mockResolvedValue(campaigns)

      await expect(service.findAll(user)).resolves.toEqual(campaigns)
      expect(prisma.campaign.findMany).toHaveBeenCalledWith({
        where: {
          invitations: {
            some: {
              influencerId: user.id,
              status: 'accepted',
            },
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          budget: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('findOne', () => {
    it('should return campaign with invitations and deliverables for brand owner', async () => {
      const user: UserPayload = {
        id: 'brand-1',
        email: 'b@example.com',
        role: Role.Brand,
      }
      const campaign = {
        id: 'camp-1',
        brandId: user.id,
        title: 'A',
        invitations: [],
        deliverables: [],
      }

      prisma.campaign.findUnique.mockResolvedValue(campaign)

      await expect(service.findOne(user, 'camp-1')).resolves.toEqual(campaign)
      expect(prisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: 'camp-1' },
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
        },
      })
    })

    it('should return scoped campaign for invited influencer with accepted status', async () => {
      const user: UserPayload = {
        id: 'inf-1',
        email: 'i@example.com',
        role: Role.Influencer,
      }
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        title: 'A',
        invitations: [
          {
            influencerId: user.id,
            status: 'accepted',
            influencer: {
              id: user.id,
              name: 'Inf',
              email: 'i@example.com',
              influencerProfile: null,
            },
          },
        ],
        deliverables: [
          { id: 'del-1', influencerId: user.id, description: 'Post' },
          { id: 'del-2', influencerId: 'inf-2', description: 'Story' },
        ],
      }

      prisma.campaign.findUnique.mockResolvedValue(campaign)

      const result = await service.findOne(user, 'camp-1')
      expect(result.invitations).toHaveLength(1)
      expect(result.deliverables).toHaveLength(1)
      expect(result.deliverables[0].id).toBe('del-1')
    })

    it('should throw NotFoundException if campaign does not exist', async () => {
      const user: UserPayload = {
        id: 'brand-1',
        email: 'b@example.com',
        role: Role.Brand,
      }
      prisma.campaign.findUnique.mockResolvedValue(null)

      await expect(service.findOne(user, 'camp-1')).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ForbiddenException if influencer has no accepted invitation', async () => {
      const user: UserPayload = {
        id: 'inf-1',
        email: 'i@example.com',
        role: Role.Influencer,
      }
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        title: 'A',
        invitations: [
          {
            influencerId: user.id,
            status: 'pending',
            influencer: {
              id: user.id,
              name: 'Inf',
              email: 'i@example.com',
              influencerProfile: null,
            },
          },
        ],
        deliverables: [],
      }

      prisma.campaign.findUnique.mockResolvedValue(campaign)

      await expect(service.findOne(user, 'camp-1')).rejects.toThrow(
        ForbiddenException
      )
    })

    it('should throw ForbiddenException for non-owner brand viewing another brand campaign', async () => {
      const user: UserPayload = {
        id: 'brand-2',
        email: 'b2@example.com',
        role: Role.Brand,
      }
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        title: 'A',
        invitations: [],
        deliverables: [],
      }

      prisma.campaign.findUnique.mockResolvedValue(campaign)

      await expect(service.findOne(user, 'camp-1')).rejects.toThrow(
        ForbiddenException
      )
    })
  })

  describe('update', () => {
    it('should update campaign if user is owner', async () => {
      const userId = 'brand-1'
      const campaignId = 'camp-1'
      const dto = { title: 'Updated Title' }
      const existing = { id: campaignId, brandId: userId, title: 'Old Title' }
      const updated = { ...existing, ...dto }

      prisma.campaign.findUnique.mockResolvedValue(existing)
      prisma.campaign.update.mockResolvedValue(updated)

      await expect(service.update(userId, campaignId, dto)).resolves.toEqual(
        updated
      )
      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: campaignId },
        data: dto,
      })
    })

    it('should throw NotFoundException if campaign not found', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null)

      await expect(service.update('brand-1', 'camp-1', {})).rejects.toThrow(
        NotFoundException
      )
      expect(prisma.campaign.update).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenException if user does not own the campaign', async () => {
      const existing = { id: 'camp-1', brandId: 'brand-1', title: 'Old' }
      prisma.campaign.findUnique.mockResolvedValue(existing)

      await expect(
        service.update('brand-2', 'camp-1', { title: 'New' })
      ).rejects.toThrow(ForbiddenException)
      expect(prisma.campaign.update).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should delete campaign if user is owner', async () => {
      const userId = 'brand-1'
      const campaignId = 'camp-1'
      const existing = { id: campaignId, brandId: userId, title: 'Old Title' }

      prisma.campaign.findUnique.mockResolvedValue(existing)
      prisma.campaign.delete.mockResolvedValue(existing)

      await expect(service.remove(userId, campaignId)).resolves.toBeUndefined()
      expect(prisma.campaign.delete).toHaveBeenCalledWith({
        where: { id: campaignId },
      })
    })

    it('should throw NotFoundException if campaign not found', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null)

      await expect(service.remove('brand-1', 'camp-1')).rejects.toThrow(
        NotFoundException
      )
      expect(prisma.campaign.delete).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenException if user does not own the campaign', async () => {
      const existing = { id: 'camp-1', brandId: 'brand-1', title: 'Old' }
      prisma.campaign.findUnique.mockResolvedValue(existing)

      await expect(service.remove('brand-2', 'camp-1')).rejects.toThrow(
        ForbiddenException
      )
      expect(prisma.campaign.delete).not.toHaveBeenCalled()
    })
  })
})
