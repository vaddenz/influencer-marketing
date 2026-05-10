import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { PrismaService } from '@/common/prisma/prisma.service'

const mockPrismaService = () => {
  return {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  }
}

describe('NotificationsService', () => {
  let service: NotificationsService
  let prisma: ReturnType<typeof mockPrismaService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile()

    service = module.get<NotificationsService>(NotificationsService)
    prisma = module.get(PrismaService)
  })

  describe('findAll', () => {
    it('should return notifications for the user ordered by createdAt desc', async () => {
      const userId = 'user-1'
      const notifications = [
        {
          id: 'notif-2',
          userId,
          type: 'campaign_updated',
          title: 'Campaign Updated',
          message: 'Your campaign has been updated',
          read: false,
          relatedEntityType: 'campaign',
          relatedEntityId: 'camp-1',
          createdAt: new Date('2024-01-02'),
        },
        {
          id: 'notif-1',
          userId,
          type: 'invitation_received',
          title: 'New Invitation',
          message: 'You have a new invitation',
          read: true,
          relatedEntityType: 'invitation',
          relatedEntityId: 'inv-1',
          createdAt: new Date('2024-01-01'),
        },
      ]

      prisma.notification.findMany.mockResolvedValue(notifications)

      await expect(service.findAll(userId)).resolves.toEqual(notifications)
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          type: true,
          title: true,
          message: true,
          read: true,
          relatedEntityType: true,
          relatedEntityId: true,
          createdAt: true,
        },
      })
    })

    it('should return an empty array when user has no notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([])

      await expect(service.findAll('user-1')).resolves.toEqual([])
    })
  })

  describe('markRead', () => {
    it('should mark notification as read when it belongs to the user', async () => {
      const userId = 'user-1'
      const notificationId = 'notif-1'
      const notification = {
        id: notificationId,
        userId,
        type: 'invitation_received',
        title: 'New Invitation',
        message: 'You have a new invitation',
        read: false,
        relatedEntityType: 'invitation',
        relatedEntityId: 'inv-1',
        createdAt: new Date(),
      }
      const updated = { ...notification, read: true }

      prisma.notification.findUnique.mockResolvedValue(notification)
      prisma.notification.update.mockResolvedValue(updated)

      await expect(service.markRead(userId, notificationId)).resolves.toEqual(
        updated
      )
      expect(prisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: notificationId },
      })
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { read: true },
      })
    })

    it('should throw NotFoundException if notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null)

      await expect(service.markRead('user-1', 'notif-1')).rejects.toThrow(
        NotFoundException
      )
      expect(prisma.notification.update).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenException if notification belongs to another user', async () => {
      const notification = {
        id: 'notif-1',
        userId: 'user-2',
        type: 'invitation_received',
        title: 'New Invitation',
        message: 'You have a new invitation',
        read: false,
        relatedEntityType: 'invitation',
        relatedEntityId: 'inv-1',
        createdAt: new Date(),
      }

      prisma.notification.findUnique.mockResolvedValue(notification)

      await expect(service.markRead('user-1', 'notif-1')).rejects.toThrow(
        ForbiddenException
      )
      expect(prisma.notification.update).not.toHaveBeenCalled()
    })

    it('should return the notification early if it is already read', async () => {
      const userId = 'user-1'
      const notificationId = 'notif-1'
      const notification = {
        id: notificationId,
        userId,
        type: 'invitation_received',
        title: 'New Invitation',
        message: 'You have a new invitation',
        read: true,
        relatedEntityType: 'invitation',
        relatedEntityId: 'inv-1',
        createdAt: new Date(),
      }

      prisma.notification.findUnique.mockResolvedValue(notification)

      await expect(service.markRead(userId, notificationId)).resolves.toEqual(
        notification
      )
      expect(prisma.notification.update).not.toHaveBeenCalled()
    })
  })

  describe('markAllRead', () => {
    it('should update all unread notifications for the user and return count', async () => {
      const userId = 'user-1'
      const result = { count: 3 }

      prisma.notification.updateMany.mockResolvedValue(result)

      await expect(service.markAllRead(userId)).resolves.toEqual({ count: 3 })
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, read: false },
        data: { read: true },
      })
    })

    it('should return zero count when no unread notifications exist', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 })

      await expect(service.markAllRead('user-1')).resolves.toEqual({ count: 0 })
    })
  })
})
