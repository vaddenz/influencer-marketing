import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@/generated/prisma/client'
import { InfluencersService } from './influencers.service'
import { PrismaService } from '@/common/prisma/prisma.service'

const mockPrismaService = () => ({
  influencerProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
})

describe('InfluencersService', () => {
  let service: InfluencersService
  let prisma: ReturnType<typeof mockPrismaService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InfluencersService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile()

    service = module.get<InfluencersService>(InfluencersService)
    prisma = module.get(PrismaService)
  })

  describe('createProfile', () => {
    it('should create an influencer profile successfully', async () => {
      const userId = 'user-1'
      const dto = {
        displayName: 'Jane Doe',
        handle: 'janedoe',
        niche: 'Travel',
        followerCount: 15000,
        engagementRate: 4.5,
        platforms: [
          {
            platform: 'instagram',
            url: 'https://instagram.com/janedoe',
            followers: 10000,
          },
        ],
        locationCountry: 'US',
        locationRegion: 'California',
      }
      const created = { id: 'ip-1', userId, ...dto }

      prisma.influencerProfile.findUnique.mockResolvedValue(null)
      prisma.influencerProfile.create.mockResolvedValue(created)

      await expect(service.createProfile(userId, dto)).resolves.toEqual(created)
      expect(prisma.influencerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      })
      expect(prisma.influencerProfile.create).toHaveBeenCalledWith({
        data: { ...dto, userId },
      })
    })

    it('should throw ConflictException if profile already exists', async () => {
      const userId = 'user-1'
      const dto = {
        displayName: 'Jane Doe',
        handle: 'janedoe',
        niche: 'Travel',
        followerCount: 15000,
        engagementRate: 4.5,
        platforms: [],
        locationCountry: 'US',
        locationRegion: 'California',
      }

      prisma.influencerProfile.findUnique.mockResolvedValue({ id: 'ip-1' })

      await expect(service.createProfile(userId, dto)).rejects.toThrow(
        ConflictException
      )
      expect(prisma.influencerProfile.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException on P2002 race condition', async () => {
      const userId = 'user-1'
      const dto = {
        displayName: 'Jane Doe',
        handle: 'janedoe',
        niche: 'Travel',
        followerCount: 15000,
        engagementRate: 4.5,
        platforms: [],
        locationCountry: 'US',
        locationRegion: 'California',
      }

      prisma.influencerProfile.findUnique.mockResolvedValue(null)
      prisma.influencerProfile.create.mockRejectedValue(
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
      const profile = { id: 'ip-1', userId, displayName: 'Jane' }

      prisma.influencerProfile.findUnique.mockResolvedValue(profile)

      await expect(service.getMyProfile(userId)).resolves.toEqual(profile)
    })

    it('should throw NotFoundException if profile not found', async () => {
      prisma.influencerProfile.findUnique.mockResolvedValue(null)

      await expect(service.getMyProfile('user-1')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('updateProfile', () => {
    it('should update the profile if it exists', async () => {
      const userId = 'user-1'
      const dto = { displayName: 'Jane Updated' }
      const existing = { id: 'ip-1', userId, displayName: 'Jane' }
      const updated = { ...existing, ...dto }

      prisma.influencerProfile.findUnique.mockResolvedValue(existing)
      prisma.influencerProfile.update.mockResolvedValue(updated)

      await expect(service.updateProfile(userId, dto)).resolves.toEqual(updated)
      expect(prisma.influencerProfile.update).toHaveBeenCalledWith({
        where: { userId },
        data: dto,
      })
    })

    it('should throw NotFoundException if profile does not exist', async () => {
      prisma.influencerProfile.findUnique.mockResolvedValue(null)

      await expect(
        service.updateProfile('user-1', { displayName: 'X' })
      ).rejects.toThrow(NotFoundException)
      expect(prisma.influencerProfile.update).not.toHaveBeenCalled()
    })
  })

  describe('getPublicProfile', () => {
    it('should return public profile with user name only', async () => {
      const userId = 'user-1'
      const profile = {
        id: 'ip-1',
        userId,
        displayName: 'Jane',
        user: { name: 'Jane Doe' },
      }

      prisma.influencerProfile.findUnique.mockResolvedValue(profile)

      await expect(service.getPublicProfile(userId)).resolves.toEqual(profile)
      expect(prisma.influencerProfile.findUnique).toHaveBeenCalledWith({
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
      prisma.influencerProfile.findUnique.mockResolvedValue(null)

      await expect(service.getPublicProfile('user-1')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('search', () => {
    it('should return all candidates when no filters provided', async () => {
      const candidates = [
        {
          id: 'ip-1',
          displayName: 'Alice',
          followerCount: 5000,
          platforms: [
            {
              platform: 'instagram',
              url: 'https://instagram.com/alice',
              followers: 5000,
            },
          ],
        },
        {
          id: 'ip-2',
          displayName: 'Bob',
          followerCount: 20000,
          platforms: [
            {
              platform: 'tiktok',
              url: 'https://tiktok.com/@bob',
              followers: 20000,
            },
          ],
        },
      ]

      prisma.influencerProfile.findMany.mockResolvedValue(candidates)

      await expect(service.search({ page: 1, limit: 20 })).resolves.toEqual(
        candidates
      )
      expect(prisma.influencerProfile.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { followerCount: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should filter by q (search query)', async () => {
      const candidates = [
        {
          id: 'ip-1',
          displayName: 'Alice',
          followerCount: 5000,
          platforms: [],
        },
      ]

      prisma.influencerProfile.findMany.mockResolvedValue(candidates)

      await expect(
        service.search({ q: 'ali', page: 1, limit: 20 })
      ).resolves.toEqual(candidates)
      expect(prisma.influencerProfile.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { displayName: { contains: 'ali', mode: 'insensitive' } },
            { handle: { contains: 'ali', mode: 'insensitive' } },
            { bio: { contains: 'ali', mode: 'insensitive' } },
          ],
        },
        orderBy: { followerCount: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should filter by niche', async () => {
      const candidates = [
        {
          id: 'ip-1',
          displayName: 'Alice',
          niche: 'Travel',
          followerCount: 5000,
          platforms: [],
        },
      ]

      prisma.influencerProfile.findMany.mockResolvedValue(candidates)

      await expect(
        service.search({ niche: 'Travel', page: 1, limit: 20 })
      ).resolves.toEqual(candidates)
      expect(prisma.influencerProfile.findMany).toHaveBeenCalledWith({
        where: {
          niche: { equals: 'Travel', mode: 'insensitive' },
        },
        orderBy: { followerCount: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should filter by location and region', async () => {
      const candidates = [
        {
          id: 'ip-1',
          displayName: 'Alice',
          followerCount: 5000,
          platforms: [],
        },
      ]

      prisma.influencerProfile.findMany.mockResolvedValue(candidates)

      await expect(
        service.search({
          location: 'US',
          region: 'California',
          page: 1,
          limit: 20,
        })
      ).resolves.toEqual(candidates)
      expect(prisma.influencerProfile.findMany).toHaveBeenCalledWith({
        where: {
          locationCountry: { equals: 'US', mode: 'insensitive' },
          locationRegion: { equals: 'California', mode: 'insensitive' },
        },
        orderBy: { followerCount: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should filter by followersMin and followersMax', async () => {
      const candidates = [
        {
          id: 'ip-1',
          displayName: 'Alice',
          followerCount: 5000,
          platforms: [],
        },
      ]

      prisma.influencerProfile.findMany.mockResolvedValue(candidates)

      await expect(
        service.search({
          followersMin: 1000,
          followersMax: 10000,
          page: 1,
          limit: 20,
        })
      ).resolves.toEqual(candidates)
      expect(prisma.influencerProfile.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { followerCount: { gte: 1000 } },
            { followerCount: { lte: 10000 } },
          ],
        },
        orderBy: { followerCount: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should filter by scope (nano)', async () => {
      const candidates = [
        {
          id: 'ip-1',
          displayName: 'Alice',
          followerCount: 5000,
          platforms: [],
        },
      ]

      prisma.influencerProfile.findMany.mockResolvedValue(candidates)

      await expect(
        service.search({ scope: 'nano', page: 1, limit: 20 })
      ).resolves.toEqual(candidates)
      expect(prisma.influencerProfile.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { followerCount: { gte: 1000 } },
            { followerCount: { lte: 10000 } },
          ],
        },
        orderBy: { followerCount: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should filter by scope (mega)', async () => {
      const candidates = [
        {
          id: 'ip-1',
          displayName: 'Alice',
          followerCount: 2000000,
          platforms: [],
        },
      ]

      prisma.influencerProfile.findMany.mockResolvedValue(candidates)

      await expect(
        service.search({ scope: 'mega', page: 1, limit: 20 })
      ).resolves.toEqual(candidates)
      expect(prisma.influencerProfile.findMany).toHaveBeenCalledWith({
        where: {
          AND: [{ followerCount: { gte: 1000000 } }],
        },
        orderBy: { followerCount: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should filter by platforms in application layer', async () => {
      const candidates = [
        {
          id: 'ip-1',
          displayName: 'Alice',
          followerCount: 5000,
          platforms: [
            {
              platform: 'instagram',
              url: 'https://instagram.com/alice',
              followers: 5000,
            },
          ],
        },
        {
          id: 'ip-2',
          displayName: 'Bob',
          followerCount: 20000,
          platforms: [
            {
              platform: 'tiktok',
              url: 'https://tiktok.com/@bob',
              followers: 20000,
            },
          ],
        },
        {
          id: 'ip-3',
          displayName: 'Charlie',
          followerCount: 100000,
          platforms: [
            {
              platform: 'youtube',
              url: 'https://youtube.com/charlie',
              followers: 100000,
            },
          ],
        },
      ]

      prisma.influencerProfile.findMany.mockResolvedValue(candidates)

      const result = await service.search({
        platforms: 'instagram,tiktok',
        page: 1,
        limit: 20,
      })
      expect(result).toHaveLength(2)
      expect(result.map((r: any) => r.id)).toEqual(['ip-1', 'ip-2'])
    })

    it('should combine multiple filters', async () => {
      const candidates = [
        {
          id: 'ip-1',
          displayName: 'Alice',
          niche: 'Travel',
          followerCount: 5000,
          platforms: [
            {
              platform: 'instagram',
              url: 'https://instagram.com/alice',
              followers: 5000,
            },
          ],
        },
        {
          id: 'ip-2',
          displayName: 'Bob',
          niche: 'Travel',
          followerCount: 20000,
          platforms: [
            {
              platform: 'tiktok',
              url: 'https://tiktok.com/@bob',
              followers: 20000,
            },
          ],
        },
      ]

      prisma.influencerProfile.findMany.mockResolvedValue(candidates)

      const result = await service.search({
        niche: 'Travel',
        followersMin: 1000,
        followersMax: 15000,
        platforms: 'instagram',
        page: 1,
        limit: 20,
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('ip-1')
    })
  })
})
