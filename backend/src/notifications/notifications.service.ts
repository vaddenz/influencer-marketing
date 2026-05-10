import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'

const NOTIFICATION_LIST_SELECT = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  read: true,
  relatedEntityType: true,
  relatedEntityId: true,
  createdAt: true,
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: NOTIFICATION_LIST_SELECT,
    })
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      throw new NotFoundException('Notification not found')
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You cannot mark this notification as read')
    }

    if (notification.read) {
      return notification
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })

    this.logger.log(`Notification ${notificationId} marked read by user ${userId}`)
    return updated
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })

    this.logger.log(`All notifications marked read for user ${userId}, count: ${result.count}`)
    return { count: result.count }
  }
}
