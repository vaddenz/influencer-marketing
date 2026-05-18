import { Test, TestingModule } from '@nestjs/testing'
import { Job } from 'bullmq'
import { ScrapedProfileProcessor } from './scraped-profile.processor'
import { PrismaService } from '@/common/prisma/prisma.service'

describe('ScrapedProfileProcessor', () => {
  let processor: ScrapedProfileProcessor
  let prisma: PrismaService

  const mockPrisma = {
    influencerProfile: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrapedProfileProcessor,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    processor = module.get<ScrapedProfileProcessor>(ScrapedProfileProcessor)
    prisma = module.get<PrismaService>(PrismaService)
    jest.clearAllMocks()
  })

  it('should create new profile when no match found', async () => {
    mockPrisma.influencerProfile.findFirst.mockResolvedValue(null)
    mockPrisma.influencerProfile.create.mockResolvedValue({ id: 'new-id' })

    const job = {
      data: {
        searchId: 'search-1',
        profiles: [
          {
            sourceName: 'site-a',
            sourceUrl: 'https://site-a.com/u/1',
            name: 'Alice',
            fans: 5000,
            homepageUrl: 'https://site-a.com/alice',
          },
        ],
      },
    } as Job<any>

    await processor.process(job)

    expect(mockPrisma.influencerProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          displayName: 'Alice',
          followerCount: 5000,
          homepageUrl: 'https://site-a.com/alice',
          sourceName: 'site-a',
          sourceUrl: 'https://site-a.com/u/1',
          userId: null,
        }),
      }),
    )
  })

  it('should update existing profile when homepageUrl matches', async () => {
    mockPrisma.influencerProfile.findFirst.mockResolvedValue({
      id: 'existing-id',
      displayName: 'Alice',
      followerCount: 3000,
      bio: null,
    })

    const job = {
      data: {
        searchId: 'search-1',
        profiles: [
          {
            sourceName: 'site-a',
            sourceUrl: 'https://site-a.com/u/1',
            name: 'Alice Updated',
            fans: 5000,
            bio: 'Travel blogger',
            homepageUrl: 'https://site-a.com/alice',
          },
        ],
      },
    } as Job<any>

    await processor.process(job)

    expect(mockPrisma.influencerProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'existing-id' },
        data: expect.objectContaining({
          displayName: 'Alice Updated',
          followerCount: 5000,
          bio: 'Travel blogger',
        }),
      }),
    )
  })
})
