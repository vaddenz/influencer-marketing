import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { PrismaService } from '@/common/prisma/prisma.service'
import { getQueueToken } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import * as bcrypt from 'bcrypt'
import { Role } from '@/common/enums/role.enum'

jest.mock('bcrypt')

describe('UserService', () => {
  let service: UserService
  let prismaService: PrismaService
  let emailQueue: Queue

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  }

  const mockEmailQueue = {
    add: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('email'),
          useValue: mockEmailQueue,
        },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
    prismaService = module.get<PrismaService>(PrismaService)
    emailQueue = module.get<Queue>(getQueueToken('email'))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a user and send a welcome email', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: Role.Brand,
      }

      const hashedPassword = 'hashedPassword'
      const createdUser = {
        id: 'id-1',
        ...createUserDto,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const { password, ...userData } = createUserDto
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword)
      mockPrismaService.user.create.mockResolvedValue(createdUser)

      const result = await service.create(createUserDto)

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10)
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          passwordHash: hashedPassword,
        },
      })
      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'send-email',
        {
          to: createUserDto.email,
          subject: 'Welcome!',
          body: `Hello ${createUserDto.name}, welcome to our platform!`,
        },
        expect.any(Object)
      )

      expect(result).not.toHaveProperty('passwordHash')
      expect(result.email).toBe(createUserDto.email)
    })

    it('should create a user without name and send a welcome email using default name', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        role: Role.Brand,
      }

      const hashedPassword = 'hashedPassword'
      const createdUser = {
        id: 'id-1',
        ...createUserDto,
        name: null,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword)
      mockPrismaService.user.create.mockResolvedValue(createdUser)

      const result = await service.create(createUserDto)

      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'send-email',
        {
          to: createUserDto.email,
          subject: 'Welcome!',
          body: `Hello User, welcome to our platform!`,
        },
        expect.any(Object)
      )
      expect(result.email).toBe(createUserDto.email)
    })
  })

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const email = 'test@example.com'
      const user = {
        id: 'id-1',
        email,
        passwordHash: 'hashedPassword',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrismaService.user.findUnique.mockResolvedValue(user)

      const result = await service.findOne(email)

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      })
      expect(result).toEqual(user)
    })

    it('should return null if not found', async () => {
      const email = 'notfound@example.com'
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      const result = await service.findOne(email)

      expect(result).toBeNull()
    })
  })

  describe('findById', () => {
    it('should return a user without password if found', async () => {
      const id = 'id-1'
      const user = {
        id,
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrismaService.user.findUnique.mockResolvedValue(user)

      const result = await service.findById(id)

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
      })
      expect(result).not.toHaveProperty('password')
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
    })

    it('should return null if not found', async () => {
      const id = 'id-999'
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      const result = await service.findById(id)

      expect(result).toBeNull()
    })
  })
})
