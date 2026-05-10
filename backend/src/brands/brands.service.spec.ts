import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@/generated/prisma/client'
import { BrandsService } from './brands.service'
import { PrismaService } from '@/common/prisma/prisma.service'

const mockPrismaService = () => ({
  brandProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
})

describe('BrandsService', () => {
  let service: BrandsService
  let prisma: ReturnType<typeof mockPrismaService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile()

    service = module.get<BrandsService>(BrandsService)
    prisma = module.get(PrismaService)
  })

  describe('createProfile', () => {
    it('should create a brand profile successfully', async () => {
      const userId = 'user-1'
      const dto = { companyName: 'Acme', industry: 'Tech' }
      const created = { id: 'bp-1', userId, ...dto }

      prisma.brandProfile.findUnique.mockResolvedValue(null)
      prisma.brandProfile.create.mockResolvedValue(created)

      await expect(service.createProfile(userId, dto)).resolves.toEqual(created)
      expect(prisma.brandProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      })
      expect(prisma.brandProfile.create).toHaveBeenCalledWith({
        data: { ...dto, userId },
      })
    })

    it('should throw ConflictException if profile already exists', async () => {
      const userId = 'user-1'
      const dto = { companyName: 'Acme', industry: 'Tech' }

      prisma.brandProfile.findUnique.mockResolvedValue({ id: 'bp-1' })

      await expect(service.createProfile(userId, dto)).rejects.toThrow(
        ConflictException
      )
      expect(prisma.brandProfile.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException on P2002 race condition', async () => {
      const userId = 'user-1'
      const dto = { companyName: 'Acme', industry: 'Tech' }

      prisma.brandProfile.findUnique.mockResolvedValue(null)
      prisma.brandProfile.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '1',
        })
      )

      await expect(service.createProfile(userId, dto)).rejects.toThrow(
        ConflictException
      )
    })
  })

  describe('getMyProfile', () => {
    it('should return the profile if found', async () => {
      const userId = 'user-1'
      const profile = { id: 'bp-1', userId, companyName: 'Acme' }

      prisma.brandProfile.findUnique.mockResolvedValue(profile)

      await expect(service.getMyProfile(userId)).resolves.toEqual(profile)
    })

    it('should throw NotFoundException if profile not found', async () => {
      prisma.brandProfile.findUnique.mockResolvedValue(null)

      await expect(service.getMyProfile('user-1')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('updateProfile', () => {
    it('should update the profile if it exists', async () => {
      const userId = 'user-1'
      const dto = { companyName: 'Acme Updated' }
      const existing = { id: 'bp-1', userId, companyName: 'Acme' }
      const updated = { ...existing, ...dto }

      prisma.brandProfile.findUnique.mockResolvedValue(existing)
      prisma.brandProfile.update.mockResolvedValue(updated)

      await expect(service.updateProfile(userId, dto)).resolves.toEqual(updated)
      expect(prisma.brandProfile.update).toHaveBeenCalledWith({
        where: { userId },
        data: dto,
      })
    })

    it('should throw NotFoundException if profile does not exist', async () => {
      prisma.brandProfile.findUnique.mockResolvedValue(null)

      await expect(
        service.updateProfile('user-1', { companyName: 'X' })
      ).rejects.toThrow(NotFoundException)
      expect(prisma.brandProfile.update).not.toHaveBeenCalled()
    })
  })

  describe('getPublicProfile', () => {
    it('should return public profile with user name only', async () => {
      const userId = 'user-1'
      const profile = {
        id: 'bp-1',
        userId,
        companyName: 'Acme',
        user: { name: 'Alice' },
      }

      prisma.brandProfile.findUnique.mockResolvedValue(profile)

      await expect(service.getPublicProfile(userId)).resolves.toEqual(profile)
      expect(prisma.brandProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      })
    })

    it('should throw NotFoundException if profile not found', async () => {
      prisma.brandProfile.findUnique.mockResolvedValue(null)

      await expect(service.getPublicProfile('user-1')).rejects.toThrow(
        NotFoundException
      )
    })
  })
})
