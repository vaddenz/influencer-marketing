import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { SopService } from './sop.service'
import { PrismaService } from '@/common/prisma/prisma.service'
import { SopGenerationService } from './sop-generation.service'
import { Role } from '@/common/enums/role.enum'
import type { UserPayload } from '@/common/decorators/current-user.decorator'
import { SopStatus } from '@/generated/prisma'

const mockPrismaService = () => ({
  campaign: {
    findUnique: jest.fn(),
  },
  sop: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
})

const mockSopGenerationService = () => ({
  generate: jest.fn(),
})

describe('SopService', () => {
  let service: SopService
  let prisma: ReturnType<typeof mockPrismaService>
  let generationService: ReturnType<typeof mockSopGenerationService>

  const brandUser: UserPayload = {
    id: 'brand-1',
    email: 'b@example.com',
    role: Role.Brand,
  }

  const influencerUser: UserPayload = {
    id: 'inf-1',
    email: 'i@example.com',
    role: Role.Influencer,
  }

  const generateDto = {
    campaignId: 'camp-1',
    targetMarket: 'kr',
    influencerType: 'beauty',
    sellingPoints: ['天然成分', '持久度'],
    publishDate: '2026-06-10',
  }

  const generatedSop = {
    title: 'Summer Glow SOP',
    steps: [
      {
        name: 'Draft Submission',
        description: 'Submit the initial draft',
        dueDateOffset: -7,
        requirements: ['Include hook in first 3 seconds'],
      },
    ],
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SopService,
        { provide: PrismaService, useFactory: mockPrismaService },
        { provide: SopGenerationService, useFactory: mockSopGenerationService },
      ],
    }).compile()

    service = module.get<SopService>(SopService)
    prisma = module.get(PrismaService)
    generationService = module.get(SopGenerationService)
  })

  describe('create', () => {
    it('should create SOP when user is brand owner', async () => {
      const campaign = {
        id: 'camp-1',
        brandId: brandUser.id,
        title: 'Summer Glow',
        description: 'Promote skincare',
      }
      const createdSop = {
        id: 'sop-1',
        campaignId: 'camp-1',
        title: generatedSop.title,
        publishDate: new Date(generateDto.publishDate),
        targetMarket: generateDto.targetMarket,
        influencerType: generateDto.influencerType,
        sellingPoints: generateDto.sellingPoints,
        steps: generatedSop.steps,
        status: SopStatus.generated,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prisma.campaign.findUnique.mockResolvedValue(campaign)
      prisma.sop.findUnique.mockResolvedValue(null)
      generationService.generate.mockResolvedValue(generatedSop)
      prisma.sop.create.mockResolvedValue(createdSop)

      await expect(service.create(brandUser.id, generateDto)).resolves.toEqual(createdSop)
      expect(prisma.sop.create).toHaveBeenCalled()
    })

    it('should throw ForbiddenException when user is not brand owner', async () => {
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-2',
        title: 'Summer Glow',
        description: 'Promote skincare',
      }

      prisma.campaign.findUnique.mockResolvedValue(campaign)

      await expect(service.create(brandUser.id, generateDto)).rejects.toThrow(
        ForbiddenException
      )
      expect(prisma.sop.create).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenException when SOP already exists for campaign', async () => {
      const campaign = {
        id: 'camp-1',
        brandId: brandUser.id,
        title: 'Summer Glow',
        description: 'Promote skincare',
      }
      const existingSop = { id: 'sop-1', campaignId: 'camp-1' }

      prisma.campaign.findUnique.mockResolvedValue(campaign)
      prisma.sop.findUnique.mockResolvedValue(existingSop)

      await expect(service.create(brandUser.id, generateDto)).rejects.toThrow(
        ForbiddenException
      )
      expect(generationService.generate).not.toHaveBeenCalled()
    })
  })

  describe('findByCampaign', () => {
    it('should return SOP for brand owner', async () => {
      const campaign = {
        id: 'camp-1',
        brandId: brandUser.id,
        invitations: [],
      }
      const sop = {
        id: 'sop-1',
        campaignId: 'camp-1',
        title: 'SOP',
        publishDate: new Date(),
        targetMarket: 'kr',
        influencerType: 'beauty',
        sellingPoints: ['sp'],
        steps: [],
        status: SopStatus.generated,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prisma.campaign.findUnique.mockResolvedValue(campaign)
      prisma.sop.findUnique.mockResolvedValue(sop)

      await expect(service.findByCampaign(brandUser, 'camp-1')).resolves.toEqual(sop)
    })

    it('should return SOP for accepted influencer', async () => {
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        invitations: [
          { influencerId: influencerUser.id, status: 'accepted' },
        ],
      }
      const sop = {
        id: 'sop-1',
        campaignId: 'camp-1',
        title: 'SOP',
        publishDate: new Date(),
        targetMarket: 'kr',
        influencerType: 'beauty',
        sellingPoints: ['sp'],
        steps: [],
        status: SopStatus.generated,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prisma.campaign.findUnique.mockResolvedValue(campaign)
      prisma.sop.findUnique.mockResolvedValue(sop)

      await expect(service.findByCampaign(influencerUser, 'camp-1')).resolves.toEqual(sop)
    })

    it('should throw ForbiddenException for influencer without accepted invitation', async () => {
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        invitations: [
          { influencerId: influencerUser.id, status: 'pending' },
        ],
      }

      prisma.campaign.findUnique.mockResolvedValue(campaign)

      await expect(service.findByCampaign(influencerUser, 'camp-1')).rejects.toThrow(
        ForbiddenException
      )
      expect(prisma.sop.findUnique).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when campaign does not exist', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null)

      await expect(service.findByCampaign(brandUser, 'camp-1')).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw NotFoundException when SOP does not exist for campaign', async () => {
      const campaign = {
        id: 'camp-1',
        brandId: brandUser.id,
        invitations: [],
      }

      prisma.campaign.findUnique.mockResolvedValue(campaign)
      prisma.sop.findUnique.mockResolvedValue(null)

      await expect(service.findByCampaign(brandUser, 'camp-1')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('update', () => {
    it('should update SOP when user is brand owner', async () => {
      const sop = {
        id: 'sop-1',
        campaignId: 'camp-1',
      }
      const campaign = {
        id: 'camp-1',
        brandId: brandUser.id,
      }
      const updatedSop = {
        id: 'sop-1',
        campaignId: 'camp-1',
        title: 'Updated Title',
        publishDate: new Date(),
        targetMarket: 'kr',
        influencerType: 'beauty',
        sellingPoints: ['sp'],
        steps: [],
        status: SopStatus.generated,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prisma.sop.findUnique.mockResolvedValue(sop)
      prisma.campaign.findUnique.mockResolvedValue(campaign)
      prisma.sop.update.mockResolvedValue(updatedSop)

      await expect(
        service.update(brandUser.id, 'sop-1', { title: 'Updated Title' })
      ).resolves.toEqual(updatedSop)
      expect(prisma.sop.update).toHaveBeenCalled()
    })

    it('should throw NotFoundException when SOP does not exist', async () => {
      prisma.sop.findUnique.mockResolvedValue(null)

      await expect(service.update(brandUser.id, 'sop-1', {})).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ForbiddenException when user does not own campaign', async () => {
      const sop = {
        id: 'sop-1',
        campaignId: 'camp-1',
      }
      const campaign = {
        id: 'camp-1',
        brandId: 'brand-2',
      }

      prisma.sop.findUnique.mockResolvedValue(sop)
      prisma.campaign.findUnique.mockResolvedValue(campaign)

      await expect(service.update(brandUser.id, 'sop-1', {})).rejects.toThrow(
        ForbiddenException
      )
      expect(prisma.sop.update).not.toHaveBeenCalled()
    })
  })

  describe('regenerate', () => {
    it('should regenerate SOP when user is brand owner', async () => {
      const sop = {
        id: 'sop-1',
        campaignId: 'camp-1',
      }
      const campaign = {
        id: 'camp-1',
        brandId: brandUser.id,
        title: 'Summer Glow',
        description: 'Promote skincare',
      }
      const updatedSop = {
        id: 'sop-1',
        campaignId: 'camp-1',
        title: generatedSop.title,
        publishDate: new Date(generateDto.publishDate),
        targetMarket: generateDto.targetMarket,
        influencerType: generateDto.influencerType,
        sellingPoints: generateDto.sellingPoints,
        steps: generatedSop.steps,
        status: SopStatus.generated,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prisma.sop.findUnique.mockResolvedValue(sop)
      prisma.campaign.findUnique.mockResolvedValue(campaign)
      generationService.generate.mockResolvedValue(generatedSop)
      prisma.sop.update.mockResolvedValue(updatedSop)

      await expect(service.regenerate(brandUser.id, 'sop-1', generateDto)).resolves.toEqual(updatedSop)
      expect(generationService.generate).toHaveBeenCalled()
      expect(prisma.sop.update).toHaveBeenCalled()
    })
  })

  describe('activate', () => {
    it('should activate SOP when user is brand owner', async () => {
      const sop = {
        id: 'sop-1',
        campaignId: 'camp-1',
      }
      const campaign = {
        id: 'camp-1',
        brandId: brandUser.id,
      }
      const activatedSop = {
        id: 'sop-1',
        campaignId: 'camp-1',
        title: 'SOP',
        publishDate: new Date(),
        targetMarket: 'kr',
        influencerType: 'beauty',
        sellingPoints: ['sp'],
        steps: [],
        status: SopStatus.active,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prisma.sop.findUnique.mockResolvedValue(sop)
      prisma.campaign.findUnique.mockResolvedValue(campaign)
      prisma.sop.update.mockResolvedValue(activatedSop)

      await expect(service.activate(brandUser.id, 'sop-1')).resolves.toEqual(activatedSop)
      expect(prisma.sop.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: SopStatus.active },
        })
      )
    })
  })

  describe('push', () => {
    it('should return sop and bindings when SOP is active', async () => {
      const sop = {
        id: 'sop-1',
        campaignId: 'camp-1',
        status: SopStatus.active,
        bindings: [{ id: 'bind-1' }],
      }
      const campaign = {
        id: 'camp-1',
        brandId: brandUser.id,
      }

      prisma.sop.findUnique.mockResolvedValue(sop)
      prisma.campaign.findUnique.mockResolvedValue(campaign)

      const result = await service.push(brandUser.id, 'sop-1')
      expect(result.sop).toEqual(sop)
      expect(result.bindings).toEqual(sop.bindings)
    })

    it('should throw ForbiddenException when SOP is not active', async () => {
      const sop = {
        id: 'sop-1',
        campaignId: 'camp-1',
        status: SopStatus.generated,
        bindings: [],
      }
      const campaign = {
        id: 'camp-1',
        brandId: brandUser.id,
      }

      prisma.sop.findUnique.mockResolvedValue(sop)
      prisma.campaign.findUnique.mockResolvedValue(campaign)

      await expect(service.push(brandUser.id, 'sop-1')).rejects.toThrow(
        ForbiddenException
      )
    })
  })
})
